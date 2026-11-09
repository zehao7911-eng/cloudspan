# CLOUDSPAN

Tap a numbered island to build a bridge and send the courier across. The number is the wood cost. Reach the lighthouse for a star. Light every beacon and keep the wood reserve listed in the island menu for two more stars. Undo retrieves the last bridge and its wood before the lighthouse is lit.

Eight maps, 24 stars, three courier coats, English interface, touch and keyboard-accessible buttons. The game saves the route and best stars locally.

Open index.html or standalone.html from the ZIP. Both are self-contained game entries. index-source.html and the modules are the editable sources. Build with python build.py. Run node core-tests.mjs and node sdk-tests.mjs for the route and SDK tests.

The Combos reference is Sky Bridge by Gec. The first stage was played to the island edge and one bridge block was placed. CLOUDSPAN uses original artwork and its own finite budget route rules.

The optional GameWave adapter uses cloudspan-v1 for this game's local data. Its cloud profile contains only this game's best stars, reward flags and settings. A committed bridge or undo starts a resumed round. Reaching the lighthouse or leaving an active round ends it. The browser can run the game independently. Teal and lilac coats are earned through stars or qualifying GameWave events. The host API and callbacks were checked against the October 30 documentation. https://rg975ojk5z.feishu.cn/wiki/MQg7wMknzieOkukxyWVc4UB0nDh
