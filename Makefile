all:
	npm run debug

release:
	npm run release

deploy:
	npm run release
	# cp ../demo/cgraph/lib/scivi-cgraph.min.js ../../../scivi.tools/scivi.web/lib/cgraph/cgraph.min.js
	# cp ../demo/cgraph/css/loc-en.js ../../../scivi.tools/scivi.web/lib/cgraph/cgraph.loc.js
	# cp ../demo/cgraph/css/default.css ../../../scivi.tools/scivi.web/lib/cgraph/cgraph.css
	# sed -i .bak 's/g_loc_en/g_loc/g' ../../../scivi.tools/scivi.web/lib/cgraph/cgraph.loc.js