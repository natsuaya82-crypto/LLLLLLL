/* Lingua — everything a screen is allowed to ask for
   Loaded by www/index.html LAST but one, after every file that defines these,
   and before www/boot.js starts the app.
   ES5 only: this runs in an old WKWebView. tools/es5-check.mjs enforces it.

   This is the list of names a button may carry. It is written by hand, and it
   is written with the function itself rather than with its name as text:

     act('openWord', openWord);

   That second argument is the whole point. If openWord is deleted or renamed,
   this line stops the app the moment it loads -- loudly, on the first screen,
   in front of whoever is working -- instead of the button failing silently on
   a device weeks later. Nothing else in this codebase has that property.

   Three tables, because three things happen to a control:

     act      pressed
     actIn    typed into, or chosen from a list. The value comes last, after
              whatever the markup named
     actKey   Enter pressed in a field

   tools/act-check.mjs walks every screen in every language, collects every
   name the markup asks for, and proves both directions: nothing is asked for
   that is not here, and nothing is here that no screen ever asks for. A dead
   entry is as much a bug as a missing one -- it is a button that used to
   exist. */

/* ---- pressed ----------------------------------------------------------- */
act('abNudge', abNudge);
act('abScale', abScale);
act('addBack', addBack);
act('addDropAt', addDropAt);
act('addLtr', addLtr);
act('addOne', addOne);
act('addPh', addPh);
act('addSetU', addSetU);
act('asSay', asSay);
act('back', back);
act('setPlan', setPlan);
act('clearFq', clearFq);
act('clearQ', clearQ);
act('delNote', delNote);
act('delWord', delWord);
act('doImport', doImport);
act('impScan', impScan);
act('impSetDup', impSetDup);
act('impAgain', impAgain);
act('impUndo', impUndo);
act('dropSnd', dropSnd);
act('editGlyph', editGlyph);
act('editLetter', editLetter);
act('editName', editName);
act('exportCSV', exportCSV);
act('fPick', fPick);
act('geCircle', geCircle);
act('geClear', geClear);
act('ltDelete', ltDelete);
act('geUndo', geUndo);
act('geSave', geSave);
act('ghShow', ghShow);
act('go', go);
act('goIn', goIn);
act('goPlans', goPlans);
act('goTab', goTab);
act('langOpen', langOpen);
act('ltDropChar', ltDropChar);
act('newLetter', newLetter);
act('numSetBase', numSetBase);
act('obBack', obBack);
act('obBorrow', obBorrow);
act('obDone', obDone);
act('obName', obName);
act('obNameLater', obNameLater);
act('obPickScript', obPickScript);
act('obRomDone', obRomDone);
act('obSignInApple', obSignInApple);
act('obSignInGoogle', obSignInGoogle);
act('obMailGo', obMailGo);
act('obMailIn', obMailIn);
act('obMailUp', obMailUp);
act('obMailCode', obMailCode);
act('obMailForgot', obMailForgot);
act('obWhoGo', obWhoGo);
act('setSignOut', setSignOut);
act('setMail', setMail);
act('obSkip', obSkip);
act('obSkipDraw', obSkipDraw);
act('sndFeel', sndFeel);
act('openSnd', openSnd);
act('ltTakeSnd', ltTakeSnd);
act('sndFeelAgain', sndFeelAgain);
act('sndFeelMore', sndFeelMore);
act('obTakeCh', obTakeCh);
act('openAdd', openAdd);
act('openImport', openImport);
act('openNote', openNote);
act('ntSearch', ntSearch);
act('openOwnPhase', openOwnPhase);
act('openPick', openPick);
act('openMe', openMe);
act('meDropPic', meDropPic);
act('openPost', openPost);
act('postCard', postCard);
act('postLike', postLike);
act('postBoost', postBoost);
act('postReply', postReply);
act('postDel', postDel);
act('pwSend', pwSend);
act('openSlot', openSlot);
act('openWord', openWord);
act('pkSwitch', pkSwitch);
act('saveNote', saveNote);
act('saveWord', saveWord);
act('sayField', sayField);
act('sayPh', sayPh);
act('abSetVow', abSetVow);
act('addSetMode', addSetMode);
act('ltTakeChar', ltTakeChar);
act('wSetFil', wSetFil);
act('setGPos', setGPos);
act('setMyFont', setMyFont);
act('setOrder', setOrder);
act('setRead', setRead);
act('wSetSort', wSetSort);
act('setTheme', setTheme);
act('setAuto', setAuto);
act('tkSetPos', tkSetPos);
act('setUi', setUi);
act('wdSetMode', wdSetMode);
act('wldSetUse', wldSetUse);
act('setWsys', setWsys);
act('stAddEx', stAddEx);
act('stAddOwn', stAddOwn);
act('stAsk', stAsk);
act('stBack', stBack);
act('stDelEx', stDelEx);
act('stDelOwn', stDelOwn);
act('stDrop', stDrop);
act('stKeep', stKeep);
act('stOpen', stOpen);
act('stSay', stSay);
act('stTake', stTake);
act('stTap', stTap);
act('sugGo', sugGo);
act('sugPick', sugPick);
act('takeOwn', takeOwn);
act('tkAdd', tkAdd);
act('tkBack', tkBack);
act('tkClear', tkClear);
act('cardOpen', cardOpen);
act('cardSave', cardSave);
act('tkSend', tkSend);
act('tkWipe', tkWipe);
act('wRelToggle', wRelToggle);
act('wdAddEx', wdAddEx);
act('wdAddMn', wdAddMn);
act('wdBack', wdBack);
act('wdDelEx', wdDelEx);
act('wdDelMn', wdDelMn);
act('wdDerive', wdDerive);
act('wdDropAt', wdDropAt);
act('wdKey', wdKey);
act('wdLtr', wdLtr);
act('wdSetU', wdSetU);
act('wipeAll', wipeAll);
act('wordsSay', wordsSay);

/* ---- typed into, or chosen ---------------------------------------------- */
actIn('impSetRole', impSetRole);
actIn('meSetName', meSetName);
actIn('meSetBio', meSetBio);
actIn('meSetPic', meSetPic);
actIn('ntSetQ', ntSetQ);
actIn('meSetHandle', meSetHandle);
actIn('pwSetLn', pwSetLn);
actIn('pwSetMn', pwSetMn);
actIn('ltSetRoman', ltSetRoman);
actIn('obLang', obLang);
actIn('obMailSet', obMailSet);
actIn('fSetQ', fSetQ);
actIn('wordsSetQ', wordsSetQ);
actIn('tkSetQ', tkSetQ);
actIn('wldSet', wldSet);
actIn('stNote', stNote);
actIn('stSetRules', stSetRules);
actIn('wdSetNt', wdSetNt);
actIn('wdSetPos', wdSetPos);

/* ---- Enter ------------------------------------------------------------- */
actKey('obName', obName);
actKey('stAddEx', stAddEx);
actKey('takeOwn', takeOwn);
actKey('wdAddEx', wdAddEx);
actKey('wdAddMn', wdAddMn);
