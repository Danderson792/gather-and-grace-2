"use strict";
/* Thanksgiving is the fourth Thursday of November in the viewer's local timezone.
   Date(year, month, day) creates local midnight, including local daylight-saving rules. */
(function (global) {
  function thanksgivingDate(year) {
    const november1 = new Date(year, 10, 1);
    const firstThursday = 1 + (4 - november1.getDay() + 7) % 7;
    return new Date(year, 10, firstThursday + 21, 0, 0, 0, 0);
  }

  function countdownState(now = new Date()) {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError('A valid Date is required.');
    const today = thanksgivingDate(now.getFullYear());
    const isThanksgiving = now.getFullYear() === today.getFullYear() &&
      now.getMonth() === today.getMonth() && now.getDate() === today.getDate();
    const target = !isThanksgiving && now >= new Date(today.getFullYear(),10,today.getDate()+1)
      ? thanksgivingDate(now.getFullYear()+1) : today;
    const secondsLeft = isThanksgiving ? 0 : Math.max(0, Math.ceil((target.getTime()-now.getTime())/1000));
    return {
      target, isThanksgiving, secondsLeft,
      days:Math.floor(secondsLeft/86400),
      hours:Math.floor((secondsLeft%86400)/3600),
      minutes:Math.floor((secondsLeft%3600)/60),
      seconds:secondsLeft%60
    };
  }

  // Export small pure helpers for the project's dependency-free tests.
  global.GGCountdown = {thanksgivingDate, countdownState};
  if (typeof document === 'undefined') return;

  const timer = document.getElementById('thanksgiving-timer');
  if (!timer) return;
  const fields = {
    days:document.getElementById('countdown-days'),
    hours:document.getElementById('countdown-hours'),
    minutes:document.getElementById('countdown-minutes'),
    seconds:document.getElementById('countdown-seconds')
  };
  const dateLabel=document.getElementById('countdown-date');
  const zoneLabel=document.getElementById('countdown-zone');
  const message=document.getElementById('countdown-message');
  let messageKind='';
  function render() {
    const remaining=countdownState(new Date());
    const {target,isThanksgiving,days,hours,minutes,seconds}=remaining;
    for(const [part,value] of Object.entries({days,hours,minutes,seconds})) {
      fields[part].textContent=part==='days'?String(value):String(value).padStart(2,'0');
    }
    const dateText = new Intl.DateTimeFormat(undefined, {weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(target);
    dateLabel.textContent=isThanksgiving?`Today is ${dateText}!`:`Thanksgiving is ${dateText}.`;
    const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
    zoneLabel.textContent=tz?`Based on your device's local time (${tz.replaceAll('_',' ')}).`:"Based on your device local date and timezone.";
    timer.setAttribute('aria-label',isThanksgiving?'Happy Thanksgiving!':`${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds until Thanksgiving begins, local time.`);
    const nextKind=isThanksgiving?'holiday':'counting';
    if(nextKind!==messageKind) {
      message.hidden=!isThanksgiving;
      message.textContent=isThanksgiving?'Happy Thanksgiving! Enjoy a wonderful day around the table.':'';
      messageKind=nextKind;
    }
  }
  render();
  // Recalculate against the browser clock rather than decrementing a stored counter.
  // Switching timezones or returning to the tab updates the displayed countdown.
  global.setInterval(render,1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
})(typeof globalThis !== 'undefined' ? globalThis : window);
