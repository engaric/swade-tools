import * as gb from './../gb.js';
import CharRoll from './CharRoll.js';

export default class SystemRoll {
    constructor(actor){
        this.actor=actor;
        this.vehicle=false;
    }


   async rollDamage(itemId){
      //  this.addJokerModifier(); 
      await   Hooks.once("renderChatMessage", (chat, html,data) => { 
        if (data.user.id==game.user.id){
        chat.update({'flags.swade-tools.rolltype':'damage'});
        }
       
    })        
        this.actor.items.get(itemId).rollDamage()
        
    }

    useManeuver(vehicle){
        this.vehicle=vehicle
    }

    async rollSkill(skillId){
       
        if (gb.setting('simpleRolls')){
            let item=this.actor.items.get(skillId);

            let skillName;
            let exp;
            if (!item){
                skillName=skillId;
                exp=`d4-2`
            } else {
                skillName=item.name;
                exp=`d${item.system.die.sides}${gb.realInt(item.system.die.modifier)?'+'+item.system.die.modifier:''}`
            }
            
            let content=`<div class="swadetools-itemfulldata">
            <strong>${skillName}</strong>: ${exp}
            </div>
            <div class="swadetools-formpart"><div class="swadetools-mod-add"><label><strong>${gb.trans('Modifier')}</strong> <i class="far fa-question-circle swadetools-hint" title="${gb.trans('ModHint')}"></i></label></label><input type="text" id="mod" value=""></div></div>`
            new Dialog({
                title: skillName,
                content: content,
                default: 'ok',
                buttons: {
                   
                    ok: {
                        label: `<i class="fas fa-dice"></i> ${gb.trans('Roll','SWADE')}`,
                        callback: (html)=>{
                        
                            
                            let cr=new CharRoll(this.actor);
                            if (this.vehicle){
                                cr.addModifier(0-this.vehicle.system.wounds.value,gb.trans('Handling','SWADE'))
                            }
                            cr.addModifier(html.find("#mod")[0].value,gb.trans('Additional'))
                            cr.rollSkill(skillName)
                            cr.addFlag('rolltype','skill')
                            cr.display();
                            
                        }
                    }
    
                    
                }
            }).render(true);
           

        } else {
         //   this.addJokerModifier();  
         await Hooks.once("renderChatMessage", (chat, html,data) => { 
           // console.log(data);
            if (data.user.id==game.user.id){
            chat.update({'flags.swade-tools.rolltype':'skill'});
            }
        })
           this.actor.rollSkill(skillId)
    }
        
    }

    async rollRun(){
        if (gb.setting('simpleRolls')){
            let content=`<div class="swadetools-itemfulldata">
                    <strong>${gb.trans('Running','SWADE')}</strong>: ${this.actor.system.stats.speed.adjusted}+d${this.actor.system.stats.speed.runningDie}${gb.stringMod(this.actor.system.stats.speed.runningMod)}
                    </div>
                    <div class="swadetools-formpart"><div class="swadetools-mod-add"><label><strong>${gb.trans('Modifier')}</strong> <i class="far fa-question-circle swadetools-hint" title="${gb.trans('ModHint')}"></i></label></label><input type="text" id="mod" value=""></div></div>`
                    new Dialog({
                        title: gb.trans('Running','SWADE'),
                        content: content,
                        default: 'ok',
                        buttons: {
                           
                            ok: {
                                label: `<i class="fas fa-dice"></i> ${gb.trans('Roll','SWADE')}`,
                                callback: (html)=>{
                                
                                    
                                    let cr=new CharRoll(this.actor)
                                    cr.addModifier(html.find("#mod")[0].value,gb.trans('Additional'))
                                    cr.rollRun()
                                   // cr.addFlag('rolltype','attribute')
                                    cr.display();
                                    
                                }
                            }
            
                            
                        }
                    }).render(true);
        } else {
            this.actor.rollRunningDie();
        }
        
    }

    /* addJokerModifier(){ /// removed, now in system
        if (gb.actorIsJoker(this.actor)){
            Hooks.once('renderDialog',(dialog,html,data)=>{
                html.find('input#bonus').val('+2');
            });
        }
    } */

    async rollAtt(attribute){

        if (gb.setting('simpleRolls')){

            let content=`<div class="swadetools-itemfulldata">
                    <strong>${gb.trans(gb.attrlang[attribute],'SWADE')}</strong>: d${this.actor.system.attributes[attribute].die.sides}${gb.realInt(this.actor.system.attributes[attribute].die.modifier)?'+'+this.actor.system.attributes[attribute].die.modifier:''}
                    </div>
                    <div class="swadetools-formpart"><div class="swadetools-mod-add"><label><strong>${gb.trans('Modifier')}</strong> <i class="far fa-question-circle swadetools-hint" title="${gb.trans('ModHint')}"></i></label></label><input type="text" id="mod" value=""></div></div>`
                    new Dialog({
                        title: gb.trans(gb.attrlang[attribute],'SWADE'),
                        content: content,
                        default: 'ok',
                        buttons: {
                           
                            ok: {
                                label: `<i class="fas fa-dice"></i> ${gb.trans('Roll','SWADE')}`,
                                callback: (html)=>{
                                
                                    
                                    let cr=new CharRoll(this.actor)
                                    cr.addModifier(html.find("#mod")[0].value,gb.trans('Additional'))
                                    cr.rollAtt(attribute)
                                    cr.addFlag('rolltype','attribute')
                                    cr.display();
                                    
                                }
                            }
            
                            
                        }
                    }).render(true);

        } else {
    
         //   console.log('called');
           // this.addJokerModifier();   
           await Hooks.once("renderChatMessage", (chat, html,data) => { 
            if (data.user.id==game.user.id){
            chat.update({'flags.swade-tools.rolltype':'attribute'});
            }
           
        })        
            this.actor.rollAttribute(attribute)
        }
    }
}