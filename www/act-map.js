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
act('addOne', addOne);
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
act('ltSave', ltSave);
act('geUndo', geUndo);
act('geSave', geSave);
act('ghShow', ghShow);
act('go', go);
act('goIn', goIn);
act('openHelp', openHelp);
act('goPlans', goPlans);
act('goTab', goTab);
act('kbAddKey', kbAddKey);
act('kbAddLay', kbAddLay);
act('kbDropLay', kbDropLay);
act('kbAddRow', kbAddRow);
act('kbDelKey', kbDelKey);
act('kbGoLay', kbGoLay);
act('kbPick', kbPick);
act('kbReset', kbReset);
act('kbSettings', kbSettings);
act('setKbRom', setKbRom);
act('kbSetKind', kbSetKind);
act('kbSetLay', kbSetLay);
act('kbSetW', kbSetW);
act('kbSlot', kbSlot);
act('kbTake', kbTake);
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
act('openSndAdd', openSndAdd);
act('sndTake', sndTake);
act('sndDrop', sndDrop);
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
act('meFollow', meFollow);
act('meDropPic', meDropPic);
act('openPost', openPost);
act('postCard', postCard);
act('postLike', postLike);
act('postBoost', postBoost);
act('kbAdd', kbAdd);
act('kbApply', kbApply);
act('kbGoBoard', kbGoBoard);
act('kbDrop', kbDrop);
act('kbMore', kbMore);
act('kbNew', kbNew);
act('snsSetTab', snsSetTab);
act('postOpen', postOpen);
act('postPic', postPic);
act('postReply', postReply);
act('postDel', postDel);
act('postMore', postMore);
act('postPin', postPin);
act('postEdit', postEdit);
act('pwPickLib', pwPickLib);
/* the voice on a post -- rec.js */
act('voStart', voStart);
act('voStop', voStop);
act('voDrop', voDrop);
act('voPlay', voPlay);
act('voPlayPW', voPlayPW);
act('pwDropPic', pwDropPic);
act('pwMarkOpen', pwMarkOpen);
act('pwMarkDel', pwMarkDel);
act('pwMarkInk', pwMarkInk);
act('pwTool', pwToolSet);
act('pwCutDo', pwCutDo);
act('pwCutAll', pwCutAll);
act('pwSend', pwSend);
act('draftKeep', draftKeep);
act('draftOpen', draftOpen);
act('draftDrop', draftDrop);
act('openSlot', openSlot);
act('openEdit', openEdit);
act('openWord', openWord);
act('pfSetTab', pfSetTab);
act('snsClearQ', snsClearQ);
act('pkSwitch', pkSwitch);
act('saveNote', saveNote);
act('saveWord', saveWord);
act('sayPh', sayPh);
act('abSetVow', abSetVow);
act('ltTakeChar', ltTakeChar);
act('openFil', openFil);
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
act('wldSetUse', wldSetUse);
act('setWldHide', setWldHide);
act('setWsys', setWsys);
act('setScriptDir', setScriptDir);
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
act('trOpen', trOpen);
act('tkAdd', tkAdd);
act('tkBack', tkBack);
act('tkClear', tkClear);
act('cardOpen', cardOpen);
act('cardSave', cardSave);
act('tkSend', tkSend);
act('tkWipe', tkWipe);
act('wRelToggle', wRelToggle);
act('relNew', relNew);
act('wRelOff', wRelOff);
act('wdAddEx', wdAddEx);
act('wdAddMn', wdAddMn);
act('wdBack', wdBack);
act('wdDelEx', wdDelEx);
act('wdDelMn', wdDelMn);
act('wdDerive', wdDerive);
act('wdDropAt', wdDropAt);
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
actIn('pwSetPic', pwSetPic);
actIn('kbSetH', kbSetH);
actIn('pwMarkSize', pwMarkSize);
actIn('pwMarkText', pwMarkText);
actIn('ltDraftName', ltDraftName);
actIn('obLang', obLang);
actIn('obMailSet', obMailSet);
actIn('fSetQ', fSetQ);
actIn('wordsSetQ', wordsSetQ);
actIn('snsSetQ', snsSetQ);
actIn('tkSetQ', tkSetQ);
actIn('wldSet', wldSet);
actIn('stNote', stNote);
actIn('stSetRules', stSetRules);
actIn('wdSetNt', wdSetNt);
/* A word is typed on the free plan, in three places: the new-word sheet, the
   editor, and the word a grammar stage asks for. */
actIn('wdSetLn', wdSetLn);
actIn('stSetLn', stSetLn);
actIn('wdSetPos', wdSetPos);
actIn('wdSetReg', wdSetReg);
actIn('wdSetTags', wdSetTags);
actIn('wdSetEty', wdSetEty);

/* ---- Enter ------------------------------------------------------------- */
actKey('obName', obName);
actKey('stAddEx', stAddEx);
actKey('takeOwn', takeOwn);
actKey('wdAddEx', wdAddEx);
actKey('wdAddMn', wdAddMn);
