import * as gb from './../gb.js';
import Char from './Char.js';
import CharRoll from './CharRoll.js';

export default class CombatControl {

    

    constructor(){
        this.previousTurn=false;   
        this.combatid=false;  
       
       // this.combatant=false;   
    }

    setCombat(id){
        if (this.combatid!=id){
            this.previousTurn=false;
        }
        this.combatid=id;
    }
   
    act(combatant){

        if(!combatant.defeated){ // ignore defeated ??? - let foundry control
        if (this.previousTurn){
            this.endTurn(this.previousTurn);
        }

      
        this.previousTurn=combatant;

       // console.log(combatant);
        
        this.startTurn(combatant);
        }
        
    }


    getFlag(combatant,scope,flag){
        if (combatant.flags?.[scope]?.[flag]!==undefined){
            return combatant.flags[scope][flag]
        } else {
            return false;
        }
    }

    setFlag(combatant,scope,flag,value){
        /* game.combat.updateEmbeddedEntity('Combatant', {
            _id: combatant.id,
          //  initiative: suitValue + cardValue,
            'flags.swadetools': {
                [flag]:value
            }
        });

        game.combat.updateEmbeddedEntity('Combatant', {
        combatant.flags.push({{flags:{[scope]:{[flag]:value}}}); */
      //  combatant.flags[scope][flag]=value;

        let update={_id:combatant._id,['flags.'+scope+'.'+flag]:value}
      //  console.log(update);
        game.combats.get(this.combatid).updateCombatant(update);
    }

    hasJoker(combatant){
        if (this.getFlag(combatant,'swade','hasJoker')===true){
            return true;
        } else {
            return false;
        }
    }

    addJoker(combatant,rollObj){
        if (this.hasJoker(combatant)){
            rollObj.addModifier(2,gb.trans("Joker"))
        } 
    }


    giveJokersBennies(combat,combatant){

        let gmJoker=false; ///PC - all players get a benny
            if (combatant.actor.data.type=='npc'){ /// NPC - GM gets a benny and each NonPC-WC
                gmJoker=true;
            } 

            if (gmJoker){
                combat.combatants.filter(el=>el.actor.data.type=='npc' && el.actor.isWildcard===true).map(combatant=>{
                    let char=new Char(combatant.actor);
                    char.giveBenny();
                })

                /// also give GM a benny
                let gmPlayer=gb.GMPlayer();
                let actualBennies=gmPlayer.data.flags.swade.bennies+1
                gmPlayer.update({"flags.swade.bennies":actualBennies})

            } else {

                combat.combatants.filter(el=>el.actor.data.type=='character' && el.actor.isWildcard===true).map(combatant=>{
                   let char=new Char(combatant.actor);
                    char.giveBenny();
                })
            }
    }

    jokersWild(combat){

        this.setCombat(combat.id);
        let jokers=combat.combatants.filter(el=>el.flags?.swade?.hasJoker===true && (el.flags?.['swade-tools']?.jokersWild===undefined || el.flags?.['swade-tools']?.jokersWild!=combat.round));

        if (jokers.length>0){


            jokers.map(combatant=>{
                this.setFlag(combatant,gb.moduleName,'jokersWild',combat.round)
                this.giveJokersBennies(combat,combatant);
                
            })
            
            gb.say(gb.trans('JokersWildMsg'),gb.trans('JokersWild')) /// working but show message twice    
           
            return true;
        }
        
       return false;
        
    }


    unshaken(combatant){
        let actor=combatant.actor;
      //  console.log(actor);
        let charRoll=new CharRoll(actor);
        
        this.addJoker(combatant,charRoll);
          
        charRoll.addFlavor(`<div>${gb.trans("UnShakenAttempt")}</div>`);
        charRoll.rollAtt('spirit');    
        charRoll.display();

        let char=new Char(actor);

        if (charRoll.isSuccess()){
           
            char.off('isShaken');
            char.say(gb.trans("RemShaken"))
        } else {
            if (char.bennyCount()){

                char.say(`<button class="swadetools-simplebutton" data-swade-tools-action="unshakeBenny:${actor.id}">${gb.trans('UnshakenBennyButton')}</button>`)

            } else {
                char.say(`${gb.trans('NoBennies')}, ${gb.trans('StillShaken')}`)
            } 
        }
        
    }

    unstunned(combatant){
        let actor=combatant.actor;
        let charRoll=new CharRoll(actor);        
        this.addJoker(combatant,charRoll);    
        charRoll.addFlavor(`<div>${gb.trans("UnStunnedAttempt")}</div>`);
        charRoll.rollAtt('vigor');
        charRoll.display();

        let char=new Char(actor);
        if (charRoll.raiseCount()==0){
            
         //   console.log('unstun');

           
           char.off('isStunned')
          


           
            
           
            char.say(gb.trans("RemStunnedSuc"))

            

            setTimeout(()=>{ /// silver tape for bug
                actor.update({'data.status.isDistracted':true,'data.status.isVulnerable':true})
            },500) 

                
   
           
            
            

        } else if (charRoll.raiseCount()>0){
           
            char.off('isStunned');
            char.say(gb.trans("RemStunnedRaise"))
        } else {
            /// failure
            char.say(gb.trans('StillStunned'));
        }
    }

    startTurn(combatant){      
        let actor=combatant.actor;
       // console.log('start: '+actor.name); 
        let char=new Char(actor);
        let checkDistracted=true;
        let checkVulnerable=true;

        /// Shaken
        if (char.is('isShaken')){
            this.unshaken(combatant);
        }

        if (char.is('isBound')){
            checkDistracted=false;
            checkVulnerable=false;
            /// TODO shows a message
            char.say(gb.trans('ItsBound')) // add buttons str-2 or athletics - warn on token move -> same for entangled
        }

        if (char.is('isEntangled')){
            checkDistracted=false;            
            /// TODO shows a message
            char.say(gb.trans('ItsEntangled')) 
        }

        if (char.is('isStunned')){
            checkDistracted=false;
            checkVulnerable=false;
            this.unstunned(combatant);
        }
        
        /// Distracted
        if (checkDistracted && char.is('isDistracted')){
            this.setFlag(combatant,gb.moduleName,'removeDistracted',1)
           // combatant.setFlag(gb.moduleName,'removeDistracted',1);
        }

        /// Vulnerable
        if (checkVulnerable && char.is('isVulnerable')){
            this.setFlag(combatant,gb.moduleName,'removeVulnerable',1)
            //combatant.setFlag(gb.moduleName,'removeVulnerable',1);
        }

        /// Stunned


        /// Bound

        /// Entangled
    }
    
    endTurn(combatant){
        let actor=combatant.actor;
      //  console.log('end: '+actor.name); 
        let char=new Char(actor);
        if (this.getFlag(combatant,gb.moduleName,'removeVulnerable')){
            char.off('isVulnerable')
            char.say(gb.trans("RemVuln"))
            this.setFlag(combatant,gb.moduleName,'removeVulnerable',0)
        }

        if (this.getFlag(combatant,gb.moduleName,'removeDistracted')){
            char.off('isDistracted');
            char.say(gb.trans("RemDistr"))
            this.setFlag(combatant,gb.moduleName,'removeDistracted',0)
        }
    }
}