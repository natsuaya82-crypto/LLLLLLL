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
act('addFmDrop', addFmDrop);
act('back', back);
/* The three answers the back arrow asks for when a post is half-written.
   OWNER 2026-08-25「下書きに保存しますか？はい　いいえ　キャンセル」 */
act('backKeep', backKeep);
act('backDrop', backDrop);
act('backStay', backStay);
act('plPick', plPick);
act('plBuy', plBuy);
act('goMod', goMod);
/* The screen above the reports, and the way in. `adminTap` is the settings
   heading counting presses -- there is no button anywhere that opens this,
   which is the point of it. goAdmin() is not here: nothing names it, because
   adminTap() calls it. */
act('adminTap', adminTap);
act('adminGo', adminGo);
/* The refresh button is gone from the admin screen: 「読み直すってなに？」
   OWNER 2026-08-26, and the answer was that it re-asked the server -- which
   the screen already does on every open, so the button was a second way to do
   what opening the page does. adminLoad() itself is still what goAdmin() and
   adminGo() call; it is no longer a thing anybody presses.
   The reports screen had one too and it is gone the same way: a screen is
   asked again by pulling it down -- www/sns.js § WHICH SCREENS ANSWER A
   PULL, and modAsk() in www/mod.js is what it asks. */
act('adminStaffAdd', adminStaffAdd);
act('adminStaffDrop', adminStaffDrop);
act('modDown', modDown);
act('modUp', modUp);
act('modOut', modOut);
act('modDrop', modDrop);
act('modIn', modIn);
act('storeRestore', storeRestore);
act('storeManage', storeManage);
/* One for every search box. www/shell.js § clearSearch. */
act('clearSearch', clearSearch);
act('delNoteGo', delNoteGo);
act('delWord', delWord);
act('doImport', doImport);
act('impScan', impScan);
act('impSetDup', impSetDup);
act('impSetInto', impSetInto);
act('impAgain', impAgain);
act('impOK', impOK);
act('impUndo', impUndo);
act('editGlyph', editGlyph);
act('editLetter', editLetter);
act('editName', editName);
act('saveName', saveName);
act('fPick', fPick);
act('geCircle', geCircle);
act('geFill', geFill);
act('geClear', geClear);
act('ltDelete', ltDelete);
act('ltWobEnd', ltWobEnd);
act('ltForUnitGo', ltForUnitGo);
act('geUndo', geUndo);
act('geRedo', geRedo);
act('geSave', geSave);
act('geHintShow', geHintShow);
act('go', go);
act('goIn', goIn);
act('openHelp', openHelp);
act('goPlans', goPlans);
/* A door drawn on the free plan, pressed. It asks upStop() and stays where it
   is; `goPlans` above is for a button whose own words already say upgrade.
   「ポップだって。その古いのは消して」 OWNER 2026-09-05. */
act('upFile', upFile);
act('upData', upData);
act('popYes', popYes);
act('popNo', popNo);
/* Saving what has been typed into the screen you are on, from the corner of
   the bar. www/shell.js § KEEP. */
act('keepPress', keepPress);
act('goTab', goTab);
act('kbAddLay', kbAddLay);
act('kbDropLay', kbDropLay);
act('kbWobEnd', kbWobEnd);
act('kbDelKey', kbDelKey);
act('kbHeadRow', kbHeadRow);
act('kbHeadCol', kbHeadCol);
act('kbCut', kbCut);
act('kbAlign', kbAlign);
act('kbInsAsk', kbInsAsk);
act('kbIns', kbIns);
act('kbInsCol', kbInsCol);
act('kbCellAdd', kbCellAdd);
act('kbTapKey', kbTapKey);
act('kbJoinSel', kbJoinSel);
act('kbOpenSel', kbOpenSel);
act('kbUndo', kbUndo);
act('kbRedo', kbRedo);
act('kbGoLay', kbGoLay);
act('kbRepat', kbRepat);
act('kbSetPat', kbSetPat);
act('kbReset', kbReset);
act('kbSettings', kbSettings);
act('setKbRom', setKbRom);
act('kbSetKind', kbSetKind);
act('kbSetLay', kbSetLay);
act('kbSetW', kbSetW);
act('kbSlot', kbSlot);
act('kbLtTap', kbLtTap);
act('kbLtPut', kbLtPut);
act('langOpen', langOpen);
act('langNew', langNew);
act('ltDropChar', ltDropChar);
act('newLetter', newLetter);
act('numStepBase', numStepBase);
act('obBack', obBack);
act('obBorrow', obBorrow);
act('obDone', obDone);
act('obName', obName);
act('obNameLater', obNameLater);
/* obFinish is not here any more. It was the door's "later" button, and the
   door has no way past it since the anonymous account went
   (OWNER 2026-08-26). The function is alive and called from three places in
   onboard.js; what is gone is any screen naming it. */
act('obPickScript', obPickScript);
act('obSignInApple', obSignInApple);
act('obSignInGoogle', obSignInGoogle);
act('obMailGo', obMailGo);
act('obMailIn', obMailIn);
act('obMailUp', obMailUp);
act('obMailCode', obMailCode);
act('obMailForgot', obMailForgot);
act('obMailAgain', obMailAgain);
act('obResetGo', obResetGo);
act('obNewPwGo', obNewPwGo);
act('obWhoGo', obWhoGo);
act('setSignOut', setSignOut);
act('setMail', setMail);
act('setPwGo', setPwGo);
act('setPwForgot', setPwForgot);
act('obSkipAll', obSkipAll);
act('obTourNext', obTourNext);
act('obTourBack', obTourBack);
act('obSnsGo', obSnsGo);
act('openSnd', openSnd);
act('ltGo', ltGo);
act('sndDrop', sndDrop);
act('ltTakeSnd', ltTakeSnd);
act('obTakeCh', obTakeCh);
act('openAdd', openAdd);
act('openImport', openImport);
/* The sheet (www/sheet.js, chapter 26): the room, the two pages under it,
   what is typed into the names field, and the two presses that do something
   -- make the PDF, and turn what came off a photograph into letters. */
act('openWrite', openWrite);
act('openWrOut', openWrOut);
act('openWrIn', openWrIn);
act('shMake', shMake);
act('shTakeIn', shTakeIn);
act('openNote', openNote);
act('ntSelOn', ntSelOn);
act('ntSelOff', ntSelOff);
act('ntSelTap', ntSelTap);
act('ntSelDel', ntSelDel);
act('ntSwTapClose', ntSwTapClose);
act('openOwnPhase', openOwnPhase);
act('openPick', openPick);
act('openMe', openMe);
/* 画像を触ったとき ── iPhone 標準のアクションシート。写真を選ぶ／削除の
   どちらになるかはシートが答えるので、名前はここ一つ。 */
act('mePicAsk', mePicAsk);
act('meFollow', meFollow);
act('meBlock', meBlock);
act('openPost', openPost);
act('openReport', openReport);
act('reportGo', reportGo);
act('postCard', postCard);
act('postLike', postLike);
act('postBoost', postBoost);
act('kbAdd', kbAdd);
act('kbApply', kbApply);
act('kbGoBoard', kbGoBoard);
act('kbDrop', kbDrop);
act('kbMore', kbMore);
act('kbNew', kbNew);
act('kbSelOn', kbSelOn);
act('kbSelOff', kbSelOff);
act('kbSelTap', kbSelTap);
act('kbSelDel', kbSelDel);
/* A tag in what somebody wrote. 「タップしたらタグの検索になる」 OWNER
   2026-09-04 -- it is the ordinary search with those characters in the box. */
act('snsTagGo', snsTagGo);
act('snsSetFil', snsSetFil);
act('snsSetSort', snsSetSort);
act('snsSaveQ', snsSaveQ);
act('snsPickSaved', snsPickSaved);
act('snsPickRecent', snsPickRecent);
act('snsDropRecent', snsDropRecent);
act('postOpen', postOpen);
act('postPic', postPic);
act('postReply', postReply);
act('postDel', postDel);
act('postMore', postMore);
act('whoMore', whoMore);
act('postPin', postPin);
act('postEdit', postEdit);
act('pwPickLib', pwPickLib);
/* the voice on a post -- rec.js */
act('voStart', voStart);
act('voStop', voStop);
act('voDrop', voDrop);
act('voPlay', voPlay);
act('pwDropPic', pwDropPic);
act('pwMarkOpen', pwMarkOpen);
act('pwMarkDel', pwMarkDel);
act('pwMarkInk', pwMarkInk);
act('pwTool', pwToolSet);
act('pwCutDo', pwCutDo);
act('pwCutAll', pwCutAll);
act('pwSend', pwSend);
act('pwFocusLn', pwFocusLn);
act('draftKeep', draftKeep);
act('draftOpen', draftOpen);
act('dfSelOn',   dfSelOn);
act('dfSelOff',  dfSelOff);
act('dfSelTap',  dfSelTap);
act('dfSelDel',  dfSelDel);
act('openSlot', openSlot);
act('openEdit', openEdit);
act('openWord', openWord);
act('pfSetTab', pfSetTab);
act('snsClearQ', snsClearQ);
act('pkSwitch', pkSwitch);
act('sayPh', sayPh);
act('abSetVow', abSetVow);
act('ltTakeChar', ltTakeChar);
act('openFil', openFil);
act('wordsSetFil', wordsSetFil);
act('setGPos', setGPos);
act('setMyFont', setMyFont);
act('setOrder', setOrder);
act('openLtView', openLtView);
act('nextLtSort', nextLtSort);
act('setLtFil', setLtFil);
act('wordsSetSort', wordsSetSort);
act('openSort', openSort);
act('wSelOn', wSelOn);
act('wSelOff', wSelOff);
act('wSelTap', wSelTap);
act('wSelDel', wSelDel);
act('wSelUndo', wSelUndo);
act('setTheme', setTheme);
act('setAuto', setAuto);
act('setUi', setUi);
act('wldArtAdd', wldArtAdd);
act('wldOvAdd', wldOvAdd);
act('wldOvDel', wldOvDel);
act('setWldHide', setWldHide);
/* the same two, asked of one section of the article rather than of the page */
act('setWldSecDl', setWldSecDl);
act('abToggle', abToggle);
act('wsPick', wsPick);
act('dirPick', dirPick);
act('g2Move', g2Move);
act('stAddOwn', stAddOwn);
act('stDelEx', stDelEx);
act('stDelOwn', stDelOwn);
act('stOpen', stOpen);
act('takeOwn', takeOwn);
act('cardOpen', cardOpen);
act('cardSave', cardSave);
act('cardSetShape', cardSetShape);
act('wRelToggle', wRelToggle);
act('relNew', relNew);
act('wRelOff', wRelOff);
act('wdMnOpen', wdMnOpen);
act('wdExOpen', wdExOpen);
act('stExOpen', stExOpen);
act('openStRules', openStRules);
act('openStEx', openStEx);
act('wdDelEx', wdDelEx);
act('wdDelMn', wdDelMn);
act('wdDerive', wdDerive);
act('spAdd', spAdd);
act('ipaToggle', ipaToggle);
act('openIpaG', openIpaG);
act('wipeLangs', wipeLangs);
act('wipeAll', wipeAll);

/* ---- typed into, or chosen ---------------------------------------------- */
actIn('impSetRole', impSetRole);
actIn('kbSetNm', kbSetNm);
actIn('meSetName', meSetName);
actIn('adminSet', adminSet);
actIn('adminStaffSet', adminStaffSet);
/* The two the profile grew. They could not be written down before
   claude/me2 came in: this file registers the FUNCTION and not its name, so a
   line here pointing at something www/me.js does not have yet stops the app on
   load -- which is the whole reason it is written this way. */
actIn('meSetLink', meSetLink);
actIn('meSetLoc', meSetLoc);
actIn('meSetBio', meSetBio);
actIn('meSetPic', meSetPic);
actIn('ntSetB', ntSetB);
actIn('meSetHandle', meSetHandle);
actIn('pwSetLn', pwSetLn);
actIn('pwSetMn', pwSetMn);
actIn('pwSetPic', pwSetPic);
actIn('pwMarkSize', pwMarkSize);
actIn('pwMarkText', pwMarkText);
actIn('ltDraftName', ltDraftName);
actIn('ltSetNote', ltSetNote);
actIn('obLang', obLang);
actIn('obMailSet', obMailSet);
actIn('setPwSet', setPwSet);
actIn('fSetQ', fSetQ);
/* the names typed into the sheet (www/sheet.js, chapter 26) */
actIn('shTyped', shTyped);
actIn('wordsSetQ', wordsSetQ);
actIn('snsSetQ', snsSetQ);
actIn('wldSet', wldSet);
actIn('wldArtSet', wldArtSet);
actIn('wldArtT', wldArtT);
actIn('wldArtB', wldArtB);
actIn('wldOvSet', wldOvSet);
actIn('stNote', stNote);
actIn('stSetRules', stSetRules);
actIn('wdSetNt', wdSetNt);
/* A word is typed on the free plan, in three places: the new-word sheet, the
   editor, and the word a grammar stage asks for. */
actIn('wdSetLn', wdSetLn);
actIn('addFmSet', addFmSet);
actIn('ipaSetQ', ipaSetQ);
actIn('ltSetQ', ltSetQ);
actIn('fmrSetAdd', fmrSetAdd);
act('fmPick', fmPick);
act('fmSay', fmSay);
act('fmOpen', fmOpen);
act('posPick', posPick);
act('openSub', openSub);
act('subPick', subPick);
act('subNewOpen', subNewOpen);
/* Forms made by a rule: writing one, and asking a word for the ones it has
   not got. */
act('fmrNew', fmrNew);
act('fmrAddAll', fmrAddAll);
act('openFmr', openFmr);
act('fmrAsk', fmrAsk);
act('fmrAdd', fmrAdd);
act('fmrSetAt', fmrSetAt);
act('regPick', regPick);
actKey('fmNew', fmNew);
actIn('wdSetTags', wdSetTags);
actIn('wdSetEty', wdSetEty);

/* ---- Enter ------------------------------------------------------------- */
actKey('obName', obName);
actKey('snsGo', snsGo);
actKey('stAddEx', stAddEx);
actKey('subNew', subNew);
actKey('takeOwn', takeOwn);
actKey('wdAddEx', wdAddEx);
actKey('wdAddMn', wdAddMn);

act('wldGet', wldGet);
