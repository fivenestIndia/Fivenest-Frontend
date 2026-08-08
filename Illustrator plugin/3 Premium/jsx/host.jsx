// host.jsx for Illustrator Enterprise Plugin

function findTextFrame(container, name) {
    var search = name.toLowerCase();
    if (container.textFrames) {
        for (var i = 0; i < container.textFrames.length; i++) {
            var tf = container.textFrames[i];
            if (tf.name.toLowerCase() === search || (tf.contents && tf.contents.toLowerCase() === search)) {
                return tf;
            }
        }
    }
    if (container.groupItems) {
        for (var j = 0; j < container.groupItems.length; j++) {
            var grp = container.groupItems[j];
            if (grp.name.toLowerCase() === search) {
                if (grp.textFrames && grp.textFrames.length > 0) return grp.textFrames[0];
            }
            var found = findTextFrame(grp, name);
            if (found) return found;
        }
    }
    if (container.layers) {
        for (var k = 0; k < container.layers.length; k++) {
            var lay = container.layers[k];
            if (lay.name.toLowerCase() === search) {
                if (lay.textFrames && lay.textFrames.length > 0) return lay.textFrames[0];
            }
            var found = findTextFrame(lay, name);
            if (found) return found;
        }
    }
    return null;
}

function findLayerRecursive(container, name) {
    var search = name.toLowerCase();
    if (container.layers) {
        for (var i = 0; i < container.layers.length; i++) {
            var l = container.layers[i];
            if (l.name.toLowerCase() === search) return l;
            var found = findLayerRecursive(l, name);
            if (found) return found;
        }
    }
    return null;
}

function findLayerRootFirst(container, name) {
    var search = name.toLowerCase();
    if (container.layers) {
        // First check top-level layers in this container to prevent nested layers shadowing root ones
        for (var i = 0; i < container.layers.length; i++) {
            var l = container.layers[i];
            if (l.name.toLowerCase() === search) return l;
        }
        // If not found at this level, search recursively
        for (var j = 0; j < container.layers.length; j++) {
            var found = findLayerRecursive(container.layers[j], name);
            if (found) return found;
        }
    }
    return null;
}

function updateTextFrame(name, text) {
    try {
        var tf = findTextFrame(app.activeDocument, name);
        if (tf) {
            tf.contents = (text && text.replace(/^\s+|\s+$/g, '') !== "") ? text : " ";
            return "SUCCESS";
        }
        return "NOT_FOUND";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function updateLayerFont(layerName, fontName) {
    try {
        var tf = findTextFrame(app.activeDocument, layerName);
        if (tf) {
            tf.textRange.characterAttributes.textFont = textFonts.getByName(fontName);
            return "SUCCESS";
        }
        return "NOT_FOUND";
    } catch(e) {
        return "FONT_WARNING: " + e.message;
    }
}

function compressTextWidth(layerName, maxInches) {
    try {
        var tf = findTextFrame(app.activeDocument, layerName);
        if (!tf) return "NOT_FOUND";
        
        var maxPts = maxInches * 72;
        if (tf.width > maxPts) {
            var pct = (maxPts / tf.width) * 100;
            tf.resize(pct, 100, true, true, true, true, pct, Transformation.LEFT);
            return "COMPRESSED";
        }
        return "NO_COMPRESSION_NEEDED";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function exportArtboard(w, h, resolution, format, outputPath, shouldEmbed, useLZW) {
    try {
        var doc = app.activeDocument;
        var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var wPts = w * 72;
        var hPts = h * 72;
        
        var originalRect = artboard.artboardRect;
        // Find visible bounds of current active layers to center artboard
        var bounds = doc.visibleBounds;
        var centerX = (bounds[0] + bounds[2]) / 2;
        var centerY = (bounds[1] + bounds[3]) / 2;
        var left = centerX - (wPts / 2);
        var top = centerY + (hPts / 2);
        var right = centerX + (wPts / 2);
        var bottom = centerY - (hPts / 2);
        artboard.artboardRect = [left, top, right, bottom];
        
        var file = new File(outputPath);
        
        if (format.toLowerCase() === "jpg") {
            var options = new ExportOptionsJPEG();
            options.artBoardClipping = true;
            options.qualitySetting = 100;
            options.horizontalScale = (resolution / 72) * 100;
            options.verticalScale = (resolution / 72) * 100;
            doc.exportFile(file, ExportType.JPEG, options);
        } else if (format.toLowerCase() === "png") {
            var options = new ExportOptionsPNG24();
            options.artBoardClipping = true;
            options.transparency = true;
            options.horizontalScale = (resolution / 72) * 100;
            options.verticalScale = (resolution / 72) * 100;
            doc.exportFile(file, ExportType.PNG24, options);
        } else if (format.toLowerCase() === "tiff") {
            var options = new ExportOptionsTIFF();
            options.imageColorSpace = ImageColorSpace.RGB;
            options.resolution = resolution;
            if (useLZW) {
                options.lzwCompression = true;
            }
            doc.exportFile(file, ExportType.TIFF, options);
        }
        
        artboard.artboardRect = originalRect;
        return "SUCCESS";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function processLayerArtwork(layer, action) {
    var visState = {
        layer: layer,
        visible: layer.visible,
        sublayers: []
    };
    layer.visible = true;
    
    if (action === "select") {
        if (layer.pageItems) {
            for (var i = 0; i < layer.pageItems.length; i++) {
                var item = layer.pageItems[i];
                if (!item.locked) {
                    item.selected = true;
                }
            }
        }
    }
    
    if (layer.layers) {
        for (var j = 0; j < layer.layers.length; j++) {
            visState.sublayers.push(processLayerArtwork(layer.layers[j], action));
        }
    }
    return visState;
}

function restoreLayerVisibility(visState) {
    visState.layer.visible = visState.visible;
    for (var i = 0; i < visState.sublayers.length; i++) {
        restoreLayerVisibility(visState.sublayers[i]);
    }
}

function updateTextFrameInDoc(doc, name, text) {
    try {
        var tf = findTextFrame(doc, name);
        if (tf) {
            tf.contents = (text && text.replace(/^\s+|\s+$/g, '') !== "") ? text : " ";
            return "SUCCESS";
        }
        return "NOT_FOUND";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function updateLayerFontInDoc(doc, layerName, fontName) {
    try {
        var tf = findTextFrame(doc, layerName);
        if (tf) {
            tf.textRange.characterAttributes.textFont = textFonts.getByName(fontName);
            return "SUCCESS";
        }
        return "NOT_FOUND";
    } catch(e) {
        return "FONT_WARNING: " + e.message;
    }
}

function compressTextWidthInDoc(doc, layerName, maxInches) {
    try {
        var tf = findTextFrame(doc, layerName);
        if (!tf) return "NOT_FOUND";
        
        var maxPts = maxInches * 72;
        if (tf.width > maxPts) {
            var pct = (maxPts / tf.width) * 100;
            tf.resize(pct, 100, true, true, true, true, pct, Transformation.LEFT);
            return "COMPRESSED";
        }
        return "NO_COMPRESSION_NEEDED";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function processRowInTempDoc(layerName, w, h, resolution, format, outputPath, shouldEmbed, useLZW, textUpdatesJSON, fontUpdatesJSON, compressUpdatesJSON) {
    var tempFile = null;
    var tempDoc = null;
    try {
        var doc = app.activeDocument;
        if (doc.path == "") {
            return "ERROR: Please save your master document first before running the automation.";
        }
        
        // Auto-save master document if it has unsaved changes to make sure temp copy contains latest changes
        if (!doc.saved) {
            doc.save();
        }
        
        var tempFolder = Folder.temp;
        tempFile = new File(tempFolder + "/fivenest_temp_" + new Date().getTime() + ".ai");
        
        // Copy the master file on disk to the temp file path
        var masterFile = new File(doc.fullName);
        masterFile.copy(tempFile);
        
        // Open the temporary document
        tempDoc = app.open(tempFile);
        
        // Unlock and show all layers and items in the temp document
        function unlockAll(container) {
            if (container.layers) {
                for (var i = 0; i < container.layers.length; i++) {
                    var lyr = container.layers[i];
                    lyr.locked = false;
                    lyr.visible = true;
                    unlockAll(lyr);
                }
            }
        }
        unlockAll(tempDoc);
        for (var i = 0; i < tempDoc.pageItems.length; i++) {
            try {
                tempDoc.pageItems[i].locked = false;
                tempDoc.pageItems[i].hidden = false;
            } catch(e) {}
        }
        
        // 1. Apply text updates
        var textUpdates = eval("(" + textUpdatesJSON + ")");
        for (var k = 0; k < textUpdates.length; k++) {
            var item = textUpdates[k];
            updateTextFrameInDoc(tempDoc, item.name, item.text);
        }
        
        // 2. Apply font updates
        var fontUpdates = eval("(" + fontUpdatesJSON + ")");
        for (var l = 0; l < fontUpdates.length; l++) {
            var item = fontUpdates[l];
            updateLayerFontInDoc(tempDoc, item.name, item.font);
        }
        
        // 3. Apply text compression updates
        var compressUpdates = eval("(" + compressUpdatesJSON + ")");
        for (var m = 0; m < compressUpdates.length; m++) {
            var item = compressUpdates[m];
            compressTextWidthInDoc(tempDoc, item.name, item.maxInches);
        }
        
        // 4. Find the matching artboard by name (case-insensitive substring) and activate it
        var targetAb = null;
        var targetAbIndex = 0;
        var cleanSearch = layerName.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (var idx = 0; idx < tempDoc.artboards.length; idx++) {
            var abName = tempDoc.artboards[idx].name.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (abName.indexOf(cleanSearch) > -1 || cleanSearch.indexOf(abName) > -1) {
                targetAb = tempDoc.artboards[idx];
                targetAbIndex = idx;
                break;
            }
        }
        if (!targetAb) {
            targetAb = tempDoc.artboards[0];
            targetAbIndex = 0;
        }
        tempDoc.artboards.setActiveArtboardIndex(targetAbIndex);
        
        var abRect = targetAb.artboardRect; // [left, top, right, bottom]
        var origW = Math.abs(abRect[2] - abRect[0]);
        var origH = Math.abs(abRect[3] - abRect[1]);
        
        var wPts = w * 72;
        var hPts = h * 72;
        
        // 5. Setup layer visibility and select artwork on the active artboard
        var layersToCheck = ["Front", "Back", "Half Left SL", "Half Right SL", "Full Left SL", "Full Right SL", "Only Name & Number"];
        var targetLayer = findLayerRootFirst(tempDoc, layerName);
        tempDoc.selection = null;
        
        if (targetLayer) {
            // Strategy A: Target layer exists - isolate it
            for (var n = 0; n < layersToCheck.length; n++) {
                var lyr = findLayerRootFirst(tempDoc, layersToCheck[n]);
                if (lyr) {
                    lyr.visible = (layersToCheck[n].toLowerCase() === layerName.toLowerCase());
                }
            }
            var visState = processLayerArtwork(targetLayer, "select");
        } else {
            // Strategy B: Target layer doesn't exist (e.g. nested sleeve) - show primary layout layers & select by active artboard
            for (var n = 0; n < layersToCheck.length; n++) {
                var lyr = findLayerRootFirst(tempDoc, layersToCheck[n]);
                if (lyr) {
                    var lName = layersToCheck[n].toLowerCase();
                    if (lName === "front" || lName === "back") {
                        lyr.visible = true;
                    } else {
                        lyr.visible = false;
                    }
                }
            }
            try {
                tempDoc.selectObjectsOnActiveArtboard();
            } catch(selectErr) {}
        }
        
        // Scale and position the selected artwork
        var sel = tempDoc.selection;
        if (sel.length > 0) {
            // Group them to scale together
            var group = tempDoc.groupItems.add();
            for (var p = sel.length - 1; p >= 0; p--) {
                sel[p].moveToBeginning(group);
            }
            
            var origLeft = group.left;
            var origTop = group.top;
            
            var scaleX = (wPts / origW) * 100;
            var scaleY = (hPts / origH) * 100;
            
            var originalScaleLineWeight = true;
            try {
                originalScaleLineWeight = app.preferences.getBooleanPreference('scaleLineWeight');
                app.preferences.setBooleanPreference('scaleLineWeight', true);
            } catch(prefErr) {}
            
            // Scale the group relative to its own top-left
            group.resize(scaleX, scaleY, true, true, true, true, (scaleX + scaleY)/2, Transformation.TOPLEFT);
            
            // Position group at the scaled offset relative to the artboard top-left
            var tempLeft = origLeft - abRect[0];
            var tempTop = origTop - abRect[1];
            group.left = abRect[0] + tempLeft * (scaleX / 100);
            group.top = abRect[1] + tempTop * (scaleY / 100);
            
            try {
                app.preferences.setBooleanPreference('scaleLineWeight', originalScaleLineWeight);
            } catch(prefErr) {}
        }
        
        if (targetLayer && visState) {
            restoreLayerVisibility(visState);
        }
        
        tempDoc.selection = null;
        
        // Delete all other artboards to crop exactly to the target artboard
        for (var idx = tempDoc.artboards.length - 1; idx >= 0; idx--) {
            if (idx !== targetAbIndex) {
                try {
                    tempDoc.artboards[idx].remove();
                } catch(remErr) {}
            }
        }
        
        // The remaining target artboard is now at index 0. Resize it.
        var activeAb = tempDoc.artboards[0];
        activeAb.artboardRect = [abRect[0], abRect[1], abRect[0] + wPts, abRect[1] - hPts];
        
        var file = new File(outputPath);
        
        if (format.toLowerCase() === "jpg") {
            var options = new ExportOptionsJPEG();
            options.artBoardClipping = true;
            options.qualitySetting = 100;
            options.horizontalScale = (resolution / 72) * 100;
            options.verticalScale = (resolution / 72) * 100;
            tempDoc.exportFile(file, ExportType.JPEG, options);
        } else if (format.toLowerCase() === "png") {
            var options = new ExportOptionsPNG24();
            options.artBoardClipping = true;
            options.transparency = true;
            options.horizontalScale = (resolution / 72) * 100;
            options.verticalScale = (resolution / 72) * 100;
            tempDoc.exportFile(file, ExportType.PNG24, options);
        } else if (format.toLowerCase() === "tiff") {
            var options = new ExportOptionsTIFF();
            options.imageColorSpace = ImageColorSpace.RGB;
            options.resolution = resolution;
            if (useLZW) {
                options.lzwCompression = true;
            }
            tempDoc.exportFile(file, ExportType.TIFF, options);
        }
        
        // Close temp doc without saving
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        tempDoc = null;
        
        // Delete temp file
        if (tempFile.exists) {
            tempFile.remove();
        }
        
        return "SUCCESS";
    } catch(e) {
        if (tempDoc) {
            try { tempDoc.close(SaveOptions.DONOTSAVECHANGES); } catch(ex) {}
        }
        if (tempFile && tempFile.exists) {
            try { tempFile.remove(); } catch(ex) {}
        }
        return "ERROR: " + e.message;
    }
}

function toggleLayerVisibility(name, visible) {
    try {
        var l = findLayerRootFirst(app.activeDocument, name);
        if (l) {
            l.visible = visible;
            return "SUCCESS";
        }
        return "NOT_FOUND";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function scanDesignLayers(parentLayerName) {
    try {
        var doc = app.activeDocument;
        var parentLayer = findLayerRootFirst(doc, parentLayerName);
        if (!parentLayer) return "[]";
        
        var list = [];
        // Look at sublayers of the layer
        for (var i = 0; i < parentLayer.layers.length; i++) {
            var l = parentLayer.layers[i];
            if (l.name.toLowerCase().indexOf("background") === -1 && 
                l.name.toLowerCase().indexOf("bg") === -1 && 
                l.name.toLowerCase().indexOf("color fill") === -1) {
                list.push(l.name);
            }
        }
        
        // Also look at group items if no layers found
        if (list.length === 0 && parentLayer.groupItems) {
            for (var j = 0; j < parentLayer.groupItems.length; j++) {
                var g = parentLayer.groupItems[j];
                if (g.name.toLowerCase().indexOf("background") === -1 && 
                    g.name.toLowerCase().indexOf("bg") === -1) {
                    list.push(g.name);
                }
            }
        }
        
        // Custom JSON string construction
        var str = "[";
        for (var k = 0; k < list.length; k++) {
            str += '"' + list[k].replace(/"/g, '\\"') + '"';
            if (k < list.length - 1) str += ",";
        }
        str += "]";
        return str;
    } catch(e) {
        return "[]";
    }
}

function setDesignVisibility(parentLayerName, targetDesignName) {
    try {
        var doc = app.activeDocument;
        var parentLayer = findLayerRootFirst(doc, parentLayerName);
        if (!parentLayer) return "PARENT_LAYER_NOT_FOUND";
        
        var targetNumMatch = targetDesignName.match(/\d+/);
        var targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;
        
        // Toggle sub-layers
        for (var i = 0; i < parentLayer.layers.length; i++) {
            var dl = parentLayer.layers[i];
            if (dl.name.toLowerCase().indexOf("background") === -1 && 
                dl.name.toLowerCase().indexOf("bg") === -1 && 
                dl.name.toLowerCase().indexOf("color fill") === -1) {
                
                var dlNumMatch = dl.name.match(/\d+/);
                var dlNum = dlNumMatch ? parseInt(dlNumMatch[0], 10) : null;
                
                if (targetNum !== null && dlNum !== null && targetNum === dlNum) {
                    dl.visible = true;
                } else {
                    dl.visible = (dl.name === targetDesignName);
                }
            }
        }
        return "SUCCESS";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function generateMockups(outputFolder, csvNameClean, isHalfActive) {
    try {
        var doc = app.activeDocument;
        var fullSleeveLayer = findLayerRootFirst(doc, "FULL SLEEVE");
        if (fullSleeveLayer) {
            fullSleeveLayer.visible = !isHalfActive;
        }

        var bgGroup = findLayerRootFirst(doc, "mockup bg");
        if (!bgGroup) return "MOCKUP_BG_GROUP_NOT_FOUND";
        
        bgGroup.visible = true;
        var sublayers = bgGroup.layers;
        var suffixPass = isHalfActive ? "Half" : "Full";
        
        if (sublayers && sublayers.length > 0) {
            for (var i = 0; i < sublayers.length; i++) {
                var bgLayer = sublayers[i];
                bgLayer.visible = true;
                for (var j = 0; j < sublayers.length; j++) {
                    if (j !== i) sublayers[j].visible = false;
                }
                
                var bgSuffix = bgLayer.name.replace(/[\/\\:*?"<>|]/g, "_");
                var fName = csvNameClean + " " + suffixPass + " - " + bgSuffix + ".jpg";
                var fPath = outputFolder + "/" + fName;
                
                var file = new File(fPath);
                var options = new ExportOptionsJPEG();
                options.artBoardClipping = true;
                options.qualitySetting = 80;
                doc.exportFile(file, ExportType.JPEG, options);
            }
        }
        
        bgGroup.visible = false;
        var pngName = csvNameClean + " " + suffixPass + " NoBG.png";
        var pngPath = outputFolder + "/" + pngName;
        var pngFile = new File(pngPath);
        var pngOptions = new ExportOptionsPNG24();
        pngOptions.artboardClipping = true;
        pngOptions.transparency = true;
        doc.exportFile(pngFile, ExportType.PNG24, pngOptions);
        
        bgGroup.visible = true;
        return "SUCCESS";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function mergeSleeves(pathL, pathR, pathMerged, format, resolution, useLZW) {
    try {
        var fileL = new File(pathL);
        var fileR = new File(pathR);
        if (!fileL.exists || !fileR.exists) return "FILES_NOT_FOUND";
        
        var docL = app.open(fileL);
        var abL = docL.artboards[0];
        var rectL = abL.artboardRect;
        var wPts = Math.abs(rectL[2] - rectL[0]);
        var hPts = Math.abs(rectL[3] - rectL[1]);
        
        var docR = app.open(fileR);
        var abR = docR.artboards[0];
        var rectR = abR.artboardRect;
        var hPtsR = Math.abs(rectR[3] - rectR[1]);
        
        docR.activate();
        app.activeDocument = docR;
        docR.selectObjectsOnActiveArtboard();
        app.copy();
        docR.close(SaveOptions.DONOTSAVECHANGES);
        
        docL.activate();
        app.activeDocument = docL;
        
        var padPts = 14.4; // 0.2 inches
        var newHPts = hPts + hPtsR + padPts;
        abL.artboardRect = [0, 0, wPts, -newHPts];
        
        app.paste();
        var selection = docL.selection;
        var group = docL.groupItems.add();
        for (var i = 0; i < selection.length; i++) {
            selection[i].moveToBeginning(group);
        }
        
        var targetY = -(hPts + padPts);
        var dy = targetY - group.top;
        var dx = 0 - group.left;
        group.translate(dx, dy);
        
        var fileMerged = new File(pathMerged);
        if (format.toLowerCase() === "jpg") {
            var options = new ExportOptionsJPEG();
            options.artBoardClipping = true;
            options.qualitySetting = 100;
            options.horizontalScale = (resolution / 72) * 100;
            options.verticalScale = (resolution / 72) * 100;
            docL.exportFile(fileMerged, ExportType.JPEG, options);
        } else if (format.toLowerCase() === "png") {
            var options = new ExportOptionsPNG24();
            options.artBoardClipping = true;
            options.transparency = true;
            options.horizontalScale = (resolution / 72) * 100;
            options.verticalScale = (resolution / 72) * 100;
            docL.exportFile(fileMerged, ExportType.PNG24, options);
        } else if (format.toLowerCase() === "tiff") {
            var options = new ExportOptionsTIFF();
            options.imageColorSpace = ImageColorSpace.RGB;
            options.resolution = resolution;
            if (useLZW) {
                options.lzwCompression = true;
            }
            docL.exportFile(fileMerged, ExportType.TIFF, options);
        }
        
        docL.close(SaveOptions.DONOTSAVECHANGES);
        fileL.remove();
        fileR.remove();
        return "SUCCESS";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function getLayersVisibility() {
    var doc = app.activeDocument;
    var result = {};
    var layersToCheck = ["Front", "Back", "Half Left SL", "Half Right SL", "Full Left SL", "Full Right SL", "Only Name & Number", "FULL SLEEVE", "mockup bg"];
    for (var i = 0; i < layersToCheck.length; i++) {
        var name = layersToCheck[i];
        var l = findLayerRootFirst(doc, name);
        if (l) {
            result[name] = l.visible;
        }
    }
    // Custom JSON serialization
    var str = "{";
    var keys = [];
    for (var k in result) {
        keys.push(k);
    }
    for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        str += '"' + key.replace(/"/g, '\\"') + '":' + result[key];
        if (j < keys.length - 1) str += ",";
    }
    str += "}";
    return str;
}

function restoreLayersVisibility(jsonStr) {
    try {
        var doc = app.activeDocument;
        var vis = eval("(" + jsonStr + ")");
        for (var name in vis) {
            var l = findLayerRootFirst(doc, name);
            if (l) {
                l.visible = vis[name];
            }
        }
        return "SUCCESS";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}
