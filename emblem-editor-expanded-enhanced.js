// ==UserScript==
// @name         Emblem Editor Expanded & Enhanced
// @description  Backup tools for the Rockstar Emblem Editor. Works on Tampermonkey and in DevTools directly.
// @version      0.1
// @author       Wes#1262
// @match        https://socialclub.rockstargames.com/emblems/edit/*
// @match        https://socialclub.rockstargames.com/emblems/new
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function(){

    let IDColor = "25f529";

    async function value(valueGetter, abortAfterMilliseconds = 5000){
        return await new Promise(async function(resolve, reject){
            let maxTime = new Date().getTime() + abortAfterMilliseconds;
            let testInterval = setInterval(async function(){
                let value = await valueGetter();
                if(value !== undefined){
                    clearInterval(testInterval);
                    return resolve(value);
                }else if(new Date().getTime() > maxTime){
                    clearInterval(testInterval);
                    Modals.error(new Error("Timeout while waiting for the value."));
                }
            }, 1);
        });
    }

    async function condition(test, abortAfterMilliseconds = 5000){
        await value(async function(){
            return await test() === true ? true : undefined;
        });
    }

    function countdown(waitTime){
        return new Promise(function(resolve){
            setTimeout(async function(){
                await animationFrame();
                resolve();
            }, waitTime);
        });
    }

    function animationFrame(){
        return new Promise(function(resolve){
            // Animation frame is called *before* a repaint, so we need 2 to be sure that a repaint has occurred.
            requestAnimationFrame(function(){
                requestAnimationFrame(function(){
                    resolve();
                });
            });
        });
    }

    function qs(scope, selector, minLength, maxLength = Number.MAX_SAFE_INTEGER){
        let nodeList = Array.from(scope.querySelectorAll(selector));
        if(nodeList.length < minLength || nodeList.length > maxLength){
            Modals.error(new Error("The selector " + selector + " returned an unexpected number of results."));
        }
        return nodeList;
    }

    //##################################################################################################################

    // Yes, I had to write these like this because I am dumbo.
    // If I don't, I'll forget what the functions do in no time.

    function easeInQuad(f){
        return f * f;
    }

    function reverseEaseInQuad(o){
        return Math.sqrt(o);
    }

    function easeInQuadScale(v){
        let max = 100;
        return Math.round(easeInQuad(v / max) * max);
    }

    function reverseEaseInQuadScale(v){
        let max = 100;
        return Math.round(reverseEaseInQuad(v / max) * max);
    }

    //##################################################################################################################

    function serializedToLayerInfo(sz){
        if(sz.ID !== "pixel"){
            return sz;
        }

        let li = {}

        li.rotation = 0;
        li.flippedX = false;
        li.flippedY = false;
        li.fillColor = sz.color;

        if(sz.resolution === 128){
            // 128Pixel v6
            li.ID = "rectangles/01";
            li.scaleX = li.scaleY = 1;
            li.x = (sz.x * 4) - 148;
            li.y = (sz.y * 4) - 148;
            li.borderSize = 2;
            li.borderColor = sz.color;
            li.opacity = easeInQuadScale(sz.opacity);

            // 128BrokenPixel v6
            if(
                Math.abs(li.x) === Math.abs(li.y) &&
                li.x !== li.y // same digits but just one is negative
            ){
                li.ID = "rectangles/39";
                li.rotation = 45;
                li.scaleX = li.scaleY = 2;
                li.y -= 1;
                li.borderSize = 0;
                li.borderColor = IDColor;
                li.opacity = sz.opacity;
            }
        }else if(sz.resolution === 64){
            // 64Pixel v6
            li.ID = "rectangles/03";
            li.scaleX = li.scaleY = 3;
            li.x = (sz.x * 8) - 146;
            li.y = (sz.y * 8) - 146;
            li.borderSize = 0;
            li.borderColor = IDColor;
            li.opacity = sz.opacity;
        }else if(sz.resolution === 32){
            // 32Pixel v6
            li.ID = "rectangles/03";
            li.scaleX = li.scaleY = 6;
            li.x = (sz.x * 16) - 142;
            li.y = (sz.y * 16) - 142;
            li.borderSize = 0;
            li.borderColor = IDColor;
            li.opacity = sz.opacity;
        }else if(sz.resolution === 16){
            // 16Pixel v6
            li.ID = "rectangles/01";
            li.scaleX = li.scaleY = 11;
            li.x = (sz.x * 32) - 134;
            li.y = (sz.y * 32) - 134;
            li.borderSize = 0;
            li.borderColor = IDColor;
            li.opacity = sz.opacity;
        }

        // null is returned when the layer has very low opacity and cannot be rendered
        if(li.opacity < 1){
            return null;
        }

        return li;
    }

    function layerInfoToSerialized(li){

        // By default use as-is.
        let sz = li;

        function isValidPosition(sz){
            let xIsInteger = Math.round(sz.x) === sz.x;
            let yIsInteger = Math.round(sz.y) === sz.y;
            return xIsInteger && yIsInteger;
        }

        // // 128BrokenPixel v6 ------------------ OK
        if(
            li.ID === "rectangles/39" &&
            li.rotation === 45 &&
            li.scaleX === 2 && li.scaleY === 2 &&
            Math.abs(li.x) === Math.abs(li.y + 1) &&
            li.x !== (li.y + 1) &&
            li.borderSize === 0 &&
            li.borderColor.toLowerCase() === IDColor &&
            li.flippedX === false && li.flippedY === false
        ){
            let szt = {};
            szt.ID = "pixel";
            szt.resolution = 128;
            szt.color = li.fillColor;
            szt.x = (li.x + 148) / 4;
            szt.y = (li.y + 148 + 1) / 4;
            szt.opacity = li.opacity;
            if(isValidPosition(szt)){
                sz = szt;
            }
        }

        // 128Pixel v6 ------------------ OK
        else if(
            li.ID === "rectangles/01" &&
            li.rotation === 0 &&
            li.scaleX === 1 && li.scaleY === 1 &&
            li.borderSize === 2 &&
            li.borderColor.toLowerCase() === li.fillColor.toLowerCase() &&
            li.flippedX === false && li.flippedY === false
        ){
            let szt = {};
            szt.ID = "pixel";
            szt.resolution = 128;
            szt.color = li.fillColor;
            szt.x = (li.x + 148) / 4;
            szt.y = (li.y + 148) / 4;
            szt.opacity = reverseEaseInQuadScale(li.opacity);
            if(isValidPosition(szt)){
                sz = szt;
            }
        }

        // 64Pixel v6 ------------------ OK
        else if(
            li.ID === "rectangles/03" &&
            li.rotation === 0 &&
            li.scaleX === 3 && li.scaleY === 3 &&
            li.borderSize === 0 &&
            li.borderColor.toLowerCase() === IDColor &&
            li.flippedX === false && li.flippedY === false
        ){
            let szt = {};
            szt.ID = "pixel";
            szt.resolution = 64;
            szt.color = li.fillColor;
            szt.x = (li.x + 146) / 8;
            szt.y = (li.y + 146) / 8;
            szt.opacity = li.opacity;
            if(isValidPosition(szt)){
                sz = szt;
            }
        }

        // 32Pixel v6 ------------------ OK
        else if(
            li.ID === "rectangles/03" &&
            li.rotation === 0 &&
            li.scaleX === 6 && li.scaleY === 6 &&
            li.borderSize === 0 &&
            li.borderColor.toLowerCase() === IDColor &&
            li.flippedX === false && li.flippedY === false
        ){
            let szt = {};
            szt.ID = "pixel";
            szt.resolution = 32;
            szt.color = li.fillColor;
            szt.x = (li.x + 142) / 16;
            szt.y = (li.y + 142) / 16;
            szt.opacity = li.opacity;
            if(isValidPosition(szt)){
                sz = szt;
            }
        }

        // 16Pixel v6 ------------------ OK
        else if(
            li.ID === "rectangles/01" &&
            li.rotation === 0 &&
            li.scaleX === 11 && li.scaleY === 11 &&
            li.borderSize === 0 &&
            li.borderColor.toLowerCase() === IDColor &&
            li.flippedX === false && li.flippedY === false
        ){
            let szt = {};
            szt.ID = "pixel";
            szt.resolution = 16;
            szt.color = li.fillColor;
            szt.x = (li.x + 134) / 32;
            szt.y = (li.y + 134) / 32;
            szt.opacity = li.opacity;
            if(isValidPosition(szt)){
                sz = szt;
            }
        }

        return sz;
    }

    //##################################################################################################################

    class Modals
    {
        static async message(message){
            alert("? Emblem Editor E&E Message:\n\n" + message);
            await countdown(500);
        }

        static async warning(message){
            alert("? Emblem Editor E&E Warning:\n\n" + message);
            await countdown(500);
        }

        static error(exception){
            alert("? Emblem Editor E&E Fatal Error:\n\n" + exception.message + "\nYou will need to refresh the page after this error.");
            document.documentElement.classList.add("EEEEFatalError");
            throw exception;
        }

        static async confirmImport(currentLayersCount, newLayersCount){
            let secondsForLayer = 0.5;
            let secs = secondsForLayer * newLayersCount;
            let mins = Math.round(secs / 60);

            let ETAMessage = "";
            if(mins === 0){
                ETAMessage = "This operation will take around a minute.\n";
            }else{
                ETAMessage = "This may take " + mins + " to " + (mins * 2) + " minutes depending on your CPU.\n";
            }

            let message = "? Emblem Editor E&E Message:\n\n";
            message += "You are about to import " + newLayersCount + " new layers, totaling " + (currentLayersCount + newLayersCount) + ".\n";
            message += ETAMessage;
            message += "Are you sure you want to continue?";

            let result = confirm(message);

            await countdown(500);

            return result;
        }

        static downloadTextFile(filename, content){
            let a = document.createElement('a');
            let blob = new Blob([content], {type: "text/plain"});
            let url = URL.createObjectURL(blob);
            a.setAttribute('href', url);
            a.setAttribute('download', filename);
            a.click();
        }

    }

    //##################################################################################################################

    class Validate
    {
        static RGBHexColor(color){
            if(typeof color !== "string"){
                Modals.error(new Error("The provided value is not a String."));
            }

            if(color.match(/^[0-9a-fA-F]{6}$/) === null){
                Modals.error(new Error("The provided String is not a valid RGB hex Color."));
            }

            return color.toLowerCase();
        }

        static number(value, min, max){
            if(typeof value !== "number"){
                Modals.error(new Error("The provided value is not a Number."));
            }

            if(Number.isNaN(value)){
                Modals.error(new Error("The provided Number is NaN."));
            }

            if(value < min || value > max){
                Modals.error(new Error("The provided number (" + value + ") must be greater than or equal to " + min + " and less than or equal to " + max + "."));
            }

            return +value;
        }

        static integer(value, min, max){
            value = Validate.number(value, min, max);

            if(!Number.isInteger(value)){
                Modals.error(new Error("The provided value is not an integer."));
            }

            return value;
        }
    }

    //##################################################################################################################

    class ColorTools
    {
        static RGBToHex(R, G, B){
            function ch(c) {
                let hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }
            return ch(R) + ch(G) + ch(B);
        }

        static CSSRGBToRGB(string){
            let cs = string.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);

            if(cs === null){
                Modals.error(new Error("The provided CSS rgb() color was not recognized."));
            }

            return [+cs[1], +cs[2], +cs[3]];
        }

        static CSSRGBToHex(string){
            return ColorTools.RGBToHex(...ColorTools.CSSRGBToRGB(string));
        }
    }

    //##################################################################################################################

    class EEEEScannerCanvas
    {
        #_HTMLCanvas;

        constructor(HTMLImage){
            this.#_HTMLCanvas = document.createElement('canvas');
            this.#_HTMLCanvas.width = HTMLImage.width;
            this.#_HTMLCanvas.height = HTMLImage.height;
            this.#c().drawImage(HTMLImage, 0, 0);
        }

        #c(){
            return this.#_HTMLCanvas.getContext('2d');
        }

        width(){
            return this.#_HTMLCanvas.width;
        }

        height(){
            return this.#_HTMLCanvas.height;
        }

        pixelAt(x, y){
            let pixel = this.#c().getImageData(x, y, 1, 1).data;

            let opacity = Math.round(100 * pixel[3] / 255);

            if(opacity < 1){
                return null;
            }

            let hexColor = ColorTools.RGBToHex(pixel[0], pixel[1], pixel[2]);

            return {hex: hexColor, opacity: opacity};
        }

        countOpaquePixels(){
            let count = 0;
            for(let x = 0; x < this.width(); x++){
                for(let y = 0; y < this.height(); y++){
                    count += this.pixelAt(x, y) === null ? 0 : 1;
                }
            }
            return count;
        }
    }

    //##################################################################################################################

    class EEWrapper
    {
        #_shapes;
        #_layers;

        constructor(){
            this.#_shapes = new EEWrapperShapes(this);
            this.#_layers = new EEWrapperLayers(this);
        }

        async shapes(){
            return this.#_shapes;
        }

        async layers(){
            return this.#_layers;
        }

        async addPixel(resolution, x, y, hexColor, opacity){
            if(![16, 32, 64, 128].includes(resolution)){
                Modals.error(new Error("Invalid resolution. Only 16, 32, 64, and 128 are supported."));
            }

            let layerInfo = {};
            layerInfo.ID = "pixel";
            layerInfo.resolution = resolution;
            layerInfo.x = x;
            layerInfo.y = y;
            layerInfo.color = hexColor;
            layerInfo.opacity = opacity;

            return await this.addSerialized(layerInfo);
        }

        async addSerialized(sz){
            let layerInfo = serializedToLayerInfo(sz);

            if(layerInfo === null){
                // null is returned when the layer has very low opacity and cannot be rendered
                return null;
            }

            let shapes = await this.shapes();
            let layers = await this.layers();

            let shape = await shapes.byID(layerInfo.ID);
            await shape.addOnTop();

            let layer = await layers.topMost();
            await layer.setX(layerInfo.x);
            await layer.setY(layerInfo.y);
            await layer.setScaleX(layerInfo.scaleX);
            await layer.setScaleY(layerInfo.scaleY);
            await layer.setRotation(layerInfo.rotation);
            await layer.setOpacity(layerInfo.opacity);
            await layer.setBorderSize(layerInfo.borderSize);
            await layer.setBorderColor(layerInfo.borderColor);
            await layer.setFillColor(layerInfo.fillColor);
            await layer.setFlipped(layerInfo.flippedX, layerInfo.flippedY);
        }
    }

    //##################################################################################################################

    class EEWrapperShapes
    {
        #_EEWrapper;
        #_constructed;
        #_shapeIDToShape;
        #_shapeID2ToShape;

        constructor(EEWrapper){
            this.#_EEWrapper = EEWrapper;
            this.#_shapeIDToShape = new Map();
            this.#_shapeID2ToShape = new Map();
        }

        async #lazyConstructor(){
            if(this.#_constructed){
                return;
            }

            this.#_constructed = true;

            // Collect the shape categories:
            let HTMLButtons = qs(document, "#emblemEditor-groupsList > li[group]", 5);
            for(let [index, HTMLButton] of HTMLButtons.entries()){
                let category = new EEWrapperCategoryInternal(this.#_EEWrapper, HTMLButton);
                await category.activate(index === 0);
                let HTMLButtons = qs(document, "#emblemEditor-objectsList > li > a[shape]", 2);
                for(let HTMLButton of HTMLButtons){
                    let shapeID = HTMLButton.getAttribute("shape");
                    let shapeID2 = qs(HTMLButton, ":scope > span > img[alt]", 1, 1)[0].src;
                    let shape = new EEWrapperShape(category, shapeID, shapeID2);
                    this.#_shapeIDToShape.set(shapeID, shape);
                    this.#_shapeID2ToShape.set(shapeID2, shape);
                }
            }
        }

        async byID(ID){
            await this.#lazyConstructor();
            let shape = this.#_shapeIDToShape.get(ID);
            return shape === undefined ? null : shape;
        }

        async byID2(ID2){
            await this.#lazyConstructor();
            let shape = this.#_shapeID2ToShape.get(ID2);
            return shape === undefined ? null : shape;
        }
    }

    //##################################################################################################################

    class EEWrapperCategoryInternal
    {
        #_EEWrapper;
        #_HTMLButton;
        #_shapes;

        constructor(EEWrapper, HTMLButton){
            this.#_EEWrapper = EEWrapper;
            this.#_HTMLButton = HTMLButton;
        }

        async activate(force){
            if(force){
                this.#_HTMLButton.click();
                await countdown(500);
            }else{
                let previousInnerHTML = qs(document, "#emblemEditor-objectsList", 1, 1)[0].innerHTML;
                this.#_HTMLButton.click();
                await condition(function(){
                    let HTMLList = qs(document, "#emblemEditor-objectsList", 1, 1)[0];
                    return HTMLList.innerHTML !== previousInnerHTML && HTMLList.children.length > 0;
                });
            }
        }
    }

    //##################################################################################################################

    class EEWrapperShape
    {
        #_category;
        #_ID;
        #_ID2;

        constructor(category, ID, ID2){
            this.#_category = category;
            this.#_ID = ID;
            this.#_ID2 = ID2;
        }

        async ID(){
            return this.#_ID;
        }

        async ID2(){
            return this.#_ID2;
        }

        async addOnTop(){
            let HTMLButton = null;

            let HTMLButtonSelector = "#emblemEditor-objectsList > li > a[shape='" + this.#_ID + "']";
            let HTMLButtons = qs(document, HTMLButtonSelector, 0, 1);
            if(HTMLButtons.length === 1){
                HTMLButton = HTMLButtons[0];
            }else{
                await this.#_category.activate();
                HTMLButton = qs(document, HTMLButtonSelector, 1, 1)[0];
            }

            let previousLayersCount = qs(document, "#emblemEditor-layersList > li", 0).length;
            HTMLButton.click();
            await condition(async function(){
                let newLayersCount = qs(document, "#emblemEditor-layersList > li", 0).length;
                return newLayersCount === (previousLayersCount + 1);
            });
            await animationFrame();
        }
    }

    //##################################################################################################################

    class EEWrapperLayers
    {
        #_EEWrapper;
        #_HTMLElementToLayer;
        #_layerIDToLayer;

        constructor(EEWrapper){
            this.#_EEWrapper = EEWrapper;
            this.#_HTMLElementToLayer = new Map();
            this.#_layerIDToLayer = new Map();
        }

        async purgeTombstones(){
            let m1 = new Map();
            for(let [key, layer] of this.#_HTMLElementToLayer){
                if(layer.exists()){
                    m1.set(key, layer);
                }
            }
            this.#_HTMLElementToLayer = m1;

            let m2 = new Map();
            for(let [key, layer] of this.#_layerIDToLayer){
                if(layer.exists()){
                    m2.set(key, layer);
                }
            }
            this.#_layerIDToLayer = m2;
        }

        async #layersRaw(){
            let HTMLLayersContainer = qs(document, "#emblemEditor-layersList", 1, 1)[0];
            let layers = [];
            for(let layerHTML of HTMLLayersContainer.querySelectorAll(":scope > li")){
                let layer = this.#_HTMLElementToLayer.get(layerHTML);
                if(layer === undefined){
                    layer = new EEWrapperLayer(this.#_EEWrapper, layerHTML);
                    this.#_HTMLElementToLayer.set(layerHTML, layer);
                    this.#_layerIDToLayer.set(await layer.ID(), layer);
                }
                layers.push(layer);
            }
            return layers;
        }

        async count(){
            let layersRaw = await this.#layersRaw();
            return layersRaw.length;
        }

        async topMost(){
            let layersRaw = await this.#layersRaw();
            return layersRaw.length === 0 ? null : layersRaw[0];
        }

        async byIndex(index){
            let layersRaw = await this.#layersRaw();
            let maxIndex = layersRaw.length - 1;
            let invertedIndex = (index - maxIndex) * -1
            return layersRaw[invertedIndex];
        }

        async byID(ID){
            let layer = this.#_layerIDToLayer.get(ID);
            return layer.exists() ? layer : null;
        }

        async indexOf(searchLayer){
            let index = 0;
            for(let layer of await this.iterable()){
                if(layer === searchLayer){
                    return index;
                }
                index++;
            }
            return -1;
        }

        async iterable(){
            let layersRaw = await this.#layersRaw();
            return layersRaw.reverse();
        }

        async serializeToJSON(nonPausedState){
            let layersArray = [];
            for(let layer of await this.iterable()){
                let sz = await layer.serialize();
                await nonPausedState();
                layersArray.push("\t" + JSON.stringify(sz));
            }
            return "[\n" + layersArray.join(",\n") + "\n]";
        }
    }

    //##################################################################################################################

    class EEWrapperLayer
    {
        #_EEWrapper;
        #_HTMLFlipHorizontallyButton;
        #_HTMLFlipVerticallyButton;
        #_HTMLContainer;
        #_HTMLActivationButton;
        #_HTMLThumbnailPane;
        #_HTMLThumbnailImage;
        #_HTMLBorderColorPreview;
        #_HTMLFillColorPreview;
        #_HTMLCoordsContainer;
        #_HTMLXCoordControl;
        #_HTMLXCoordValue;
        #_HTMLYCoordControl;
        #_HTMLYCoordValue;
        #_HTMLScalesContainer;
        #_HTMLXScaleControl;
        #_HTMLXScaleValue;
        #_HTMLYScaleControl;
        #_HTMLYScaleValue;
        #_HTMLRotationContainer;
        #_HTMLRotationControl;
        #_HTMLRotationValue;
        #_HTMLOpacityContainer;
        #_HTMLOpacityControl;
        #_HTMLOpacityValue;
        #_HTMLBorderSizeContainer;
        #_HTMLBorderSizeControl;
        #_HTMLBorderSizeValue;

        constructor(EEWrapper, HTMLContainer){
            this.#_EEWrapper = EEWrapper;

            this.#_HTMLFlipHorizontallyButton = qs(document, "button#tool-flipHorizontal", 1, 1)[0];
            this.#_HTMLFlipVerticallyButton = qs(document, "button#tool-flipVertical", 1, 1)[0];

            this.#_HTMLContainer = HTMLContainer;

            this.#_HTMLActivationButton = qs(this.#_HTMLContainer, ":scope > [role='button']", 1, 1)[0];

            this.#_HTMLThumbnailPane = qs(this.#_HTMLActivationButton, ":scope > div.thumb", 1, 1)[0];

            this.#_HTMLThumbnailImage = qs(this.#_HTMLThumbnailPane, ":scope > img[src^='https://s.rsg.sc/sc/images/emblems/shapes/']", 1, 1)[0];

            this.#_HTMLBorderColorPreview = qs(this.#_HTMLThumbnailPane, ":scope > a.border-swatch", 1, 1)[0];
            this.#_HTMLFillColorPreview = qs(this.#_HTMLThumbnailPane, ":scope > a.swatch", 1, 1)[0];

            this.#_HTMLCoordsContainer = qs(this.#_HTMLActivationButton, ":scope > div.extended > div.coordinates.attribute-list", 1, 1)[0];
            this.#_HTMLXCoordControl = qs(this.#_HTMLCoordsContainer, ":scope > div.coord.coord-x", 1, 1)[0];
            this.#_HTMLXCoordValue = qs(this.#_HTMLXCoordControl, ":scope > span.coord-x-val", 1, 1)[0];
            this.#_HTMLYCoordControl = qs(this.#_HTMLCoordsContainer, ":scope > div.coord.coord-y", 1, 1)[0];
            this.#_HTMLYCoordValue = qs(this.#_HTMLYCoordControl, ":scope > span.coord-y-val", 1, 1)[0];

            this.#_HTMLScalesContainer = qs(this.#_HTMLActivationButton, ":scope > div.extended > div.scales.attribute-list", 1, 1)[0];
            this.#_HTMLXScaleControl = qs(this.#_HTMLScalesContainer, ":scope > div.scale.scale-x", 1, 1)[0];
            this.#_HTMLXScaleValue = qs(this.#_HTMLXScaleControl, ":scope > span.scale-x-val", 1, 1)[0];
            this.#_HTMLYScaleControl = qs(this.#_HTMLScalesContainer, ":scope > div.scale.scale-y", 1, 1)[0];
            this.#_HTMLYScaleValue = qs(this.#_HTMLYScaleControl, ":scope > span.scale-y-val", 1, 1)[0];

            this.#_HTMLRotationContainer = qs(this.#_HTMLActivationButton, ":scope > div.extended > div.rotation.attribute-list", 1, 1)[0];
            this.#_HTMLRotationControl = qs(this.#_HTMLRotationContainer, ":scope > div.rotation-text", 1, 1)[0];
            this.#_HTMLRotationValue = qs(this.#_HTMLRotationControl, ":scope > span.rotation-val", 1, 1)[0];

            this.#_HTMLOpacityContainer = qs(this.#_HTMLActivationButton, ":scope > div.extended > div.opacity", 1, 1)[0];
            this.#_HTMLOpacityControl = qs(this.#_HTMLOpacityContainer, ":scope > span.opacity-text", 1, 1)[0];
            this.#_HTMLOpacityValue = qs(this.#_HTMLOpacityControl, ":scope > span.opacity-val", 1, 1)[0];

            this.#_HTMLBorderSizeContainer = qs(this.#_HTMLActivationButton, ":scope > div.extended > div.borderSize", 1, 1)[0];
            this.#_HTMLBorderSizeControl = qs(this.#_HTMLBorderSizeContainer, ":scope > span.borderSize-text", 1, 1)[0];
            this.#_HTMLBorderSizeValue = qs(this.#_HTMLBorderSizeControl, ":scope > span.borderSize-val", 1, 1)[0];
        }

        async #setValue(HTMLControl, HTMLClickableArea, newValue){
            await this.existsGuard();

            // Enable the control.
            HTMLClickableArea.click();

            // Wait for the input to show up.
            let inputs = await value(async function(){
                let inputs = qs(HTMLControl, ":scope > form.value-form > input[name='tmp']", 0, 1);
                return inputs.length === 1 ? inputs : undefined;
            });

            // Set the new value.
            inputs[0].value = newValue;

            // Make sure the input and its event handlers are fully loaded before sending Enter.
            await animationFrame();

            // Send the Enter key.
            inputs[0].dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, keyCode: 13}));

            // Wait for the control-activator to reappear in the DOM. I.e. wait for the input to disappear.
            await condition(async function(){
                return HTMLControl.contains(HTMLClickableArea);
            });

            // Make sure the changes were actually applied before returning control to the caller.
            await animationFrame();
        }

        async #setColor(HTMLButton, newValue){
            await this.existsGuard();

            // Enable the control.
            HTMLButton.click();

            // Wait for the color picker to show up.
            let HTMLColorPicker = await value(async function(){
                let cs = qs(document.body, ":scope > .ui-emblem-colorpicker", 0, 1);
                return cs.length === 0 ? undefined : cs[0];
            });

            if(HTMLColorPicker.classList.contains("simple")){
                // If necessary, switch to the advanced color picker.
                qs(HTMLColorPicker, ":scope > p > a.toggle", 1, 1)[0].click();

                // Wait for the color picker to become advanced.
                await condition(async function(){
                    return HTMLColorPicker.classList.contains("advanced");
                });

                // Make sure the advanced color picker and its event handlers are fully loaded.
                await animationFrame();
            }

            // Locate the hex color input.
            let HTMLHexInput = await value(async function(){
                let inputsSelector = ":scope > div.advanced > div.colorpicker > div.colorpicker_hex > input[type='text']";
                let inputs = qs(HTMLColorPicker, inputsSelector, 0, 1);
                return inputs.length === 0 ? undefined : inputs[0];
            });

            // Set the new value.
            HTMLHexInput.value = newValue;

            // Make sure the input and its event handlers are fully loaded before sending Enter.
            await animationFrame();

            // Send the Enter key.
            HTMLHexInput.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, cancelable: true, keyCode: 13}));

            // Locate the color picker close button.
            let HTMLColorPickerCloseButton = await value(async function(){
                let cs = qs(HTMLColorPicker, ":scope > h4 > a.close", 0, 1);
                return cs.length === 0 ? undefined : cs[0];
            });

            // Close the color picker.
            HTMLColorPickerCloseButton.click();

            // Make sure that the color picker actually closed before returning control to the caller.
            await animationFrame();
        }

        async #getSetFlipped(newFlippedH, newFlippedV){
            await this.existsGuard();

            // Whether the shape was flipped can be inferred from the matrix() transformation in the svg.

            // However before we do that we have to cancel the rotation temporarily.
            let rotation = await this.rotation();
            if(rotation !== 0){
                await this.setRotation(0);
            }

            // Here I am getting the matrix() value from the respective <path> object.
            let layers = await this.#_EEWrapper.layers();
            let layerIndex = await layers.indexOf(this);
            let paths = qs(document, "#emblemEditor-canvasContainer > svg > path", 1);
            let path = paths[layerIndex];
            if(path === undefined){
                throw new Error("The SVG <path> could not be found at the path index " + layerIndex + ".");
            }
            let matrix = path.getAttribute("transform").match(
                /^\s*matrix\s*\(\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*\)\s*$/
            );
            if(matrix === null){
                throw new Error("The transform matrix syntax is unrecognized.");
            }
            // If the value is negative then it's flipped on that axis.
            let flippedH = parseFloat(matrix[1]) < 0;
            let flippedV = parseFloat(matrix[4]) < 0;

            // Since we have the layer open we can also modify the value if requested.
            newFlippedH = newFlippedH === undefined ? flippedH : newFlippedH;
            newFlippedV = newFlippedV === undefined ? flippedV : newFlippedV;
            if(newFlippedH !== flippedH || newFlippedV !== flippedV){
                this.#_HTMLActivationButton.click();
                await animationFrame();

                if(newFlippedH !== flippedH){
                    this.#_HTMLFlipHorizontallyButton.click();
                    await animationFrame();
                }

                if(newFlippedV !== flippedV){
                    this.#_HTMLFlipVerticallyButton.click();
                    await animationFrame();
                }
            }

            // Finally restore the rotation to the original value.
            if(rotation !== 0){
                await this.setRotation(rotation);
            }

            return [flippedH, flippedV];
        }

        async serialize(){
            let shape = await this.shape();
            let li = {};
            let flipped = await this.flipped();
            li.ID = await await shape.ID();
            li.x = await this.x();
            li.y = await this.y();
            li.scaleX = await this.scaleX();
            li.scaleY = await this.scaleY();
            li.rotation = await this.rotation();
            li.flippedX = flipped[0];
            li.flippedY = flipped[1];
            li.borderSize = await this.borderSize();
            li.borderColor = await this.borderColor();
            li.fillColor = await this.fillColor();
            li.opacity = await this.opacity();
            return layerInfoToSerialized(li);
        }

        async exists(){
            return document.documentElement.contains(this.#_HTMLContainer);
        }

        async existsGuard(){
            if(await this.exists() === false){
                Modals.error(new Error("The layer " + (await this.ID()) + " has been deleted."));
            }
        }

        async ID(){
            return this.#_HTMLContainer.id;
        }

        async #shapeID2(){
            return this.#_HTMLThumbnailImage.src;
        }

        async shape(){
            let shapes = await this.#_EEWrapper.shapes();
            return await shapes.byID2(await this.#shapeID2());
        }

        async flipped(){
            return this.#getSetFlipped(undefined, undefined);
        }

        async setFlipped(flippedH, flippedV){
            return this.#getSetFlipped(flippedH, flippedV);
        }

        async borderColor(){
            await this.existsGuard();
            return ColorTools.CSSRGBToHex(getComputedStyle(this.#_HTMLBorderColorPreview, null).backgroundColor);
        }

        async fillColor(){
            await this.existsGuard();
            return ColorTools.CSSRGBToHex(getComputedStyle(this.#_HTMLFillColorPreview, null).backgroundColor);
        }

        async x(){
            await this.existsGuard();
            return +this.#_HTMLXCoordValue.textContent;
        }

        async y(){
            await this.existsGuard();
            return +this.#_HTMLYCoordValue.textContent;
        }

        async scaleX(){
            await this.existsGuard();
            return Math.abs(+this.#_HTMLXScaleValue.textContent);
        }

        async scaleY(){
            await this.existsGuard();
            return Math.abs(+this.#_HTMLYScaleValue.textContent);
        }

        async rotation(){
            await this.existsGuard();
            return +this.#_HTMLRotationValue.textContent;
        }

        async opacity(){
            await this.existsGuard();
            return +this.#_HTMLOpacityValue.textContent;
        }

        async borderSize(){
            await this.existsGuard();
            return +this.#_HTMLBorderSizeValue.textContent;
        }

        async setX(x){
            return await this.#setValue(this.#_HTMLXCoordControl, this.#_HTMLXCoordValue, Validate.integer(x, -2000, 2000));
        }

        async setY(y){
            return await this.#setValue(this.#_HTMLYCoordControl, this.#_HTMLYCoordValue, Validate.integer(y, -2000, 2000));
        }

        async setScaleX(x){
            return await this.#setValue(this.#_HTMLXScaleControl, this.#_HTMLXScaleValue, Validate.integer(x, 1, 500));
        }

        async setScaleY(y){
            return await this.#setValue(this.#_HTMLYScaleControl, this.#_HTMLYScaleValue, Validate.integer(y, 1, 500));
        }

        async setRotation(deg){
            return await this.#setValue(this.#_HTMLRotationControl, this.#_HTMLRotationValue, Validate.integer(deg, 0, 360));
        }

        async setOpacity(opacity){
            return await this.#setValue(this.#_HTMLOpacityControl, this.#_HTMLOpacityValue, Validate.integer(opacity, 1, 100));
        }

        async setBorderSize(size){
            return await this.#setValue(this.#_HTMLBorderSizeControl, this.#_HTMLBorderSizeValue, Validate.integer(size, 0, 20));
        }

        async setBorderColor(hex){
            return await this.#setColor(this.#_HTMLBorderColorPreview, Validate.RGBHexColor(hex));
        }

        async setFillColor(hex){
            return await this.#setColor(this.#_HTMLFillColorPreview, Validate.RGBHexColor(hex));
        }
    }

    //##################################################################################################################

    async function main(){

        // -------------------------------------------------------------------------------------------------------------

        let EEEEPanelHTMLSource = `
            <style>
                @keyframes EEEE-opacity-blink {
                    from { opacity: 0.5; }
                    50% { opacity: 1.0; }
                    to { opacity: 0.5; }
                }

                #EEEEPanel,
                #EEEEPanel > *,
                #EEEEPanel > * > *,
                #EEEEPanel > * > * > *,
                #EEEEPanel > * > * > * > *,
                #EEEEPanel > * > * > * > * > *,
                #EEEEPanel > * > * > * > * > * > *,
                #EEEEPanel > * > * > * > * > * > * > *,
                #EEEEPanel > * > * > * > * > * > * > * > *,
                #EEEEPanel > * > * > * > * > * > * > * > * > *
                    {all:initial;cursor:default;}

                html > body #emblemEditor-canvasContainer
                    {position:relative !important;}
                html > body #emblemEditor-canvasContainer > #EEEELightbox
                    {position:absolute;width:512px;height:512px;
                    image-rendering:pixelated;pointer-events:none;top:0;left:0;}

                #EEEEPageCover
                    {position:fixed;top:0;left:0;right:0;bottom:0;background:black;
                    display:none;transition:opacity 0.5s, display 0 0.5s;z-index:123456789;}
                #EEEEPageCover.blocked
                    {opacity:0.5;transition:opacity 0.5s, display 0 0;display:block;}

                html.EEEEFatalError > body > #EEEEPanel
                    {display:none !important;}
                #EEEEPanel
                    {position:fixed;z-index:123456789;width:966px;left:50%;margin-left:-487px;
                    box-shadow:0 0 25px rgba(0, 0, 0, 0.5);display:flex;flex-direction:column;
                    border:4px black solid;transition:all 0.5s;font-smooth:5px;}
                #EEEEPanel:hover
                    {bottom:0 !important;}

                #EEEEPanel > row
                    {display:flex;flex-direction:row;}
                #EEEEPanel > row > cell
                    {display:flex;flex-direction:column;flex:0 0 auto;}
                #EEEEPanel > row > cell:last-child
                    {flex:1 1 auto;}

                #EEEEPanel > row > cell > section
                    {border:4px black solid;display:flex;flex-direction:column;background:white;flex:1 1 auto;}
                #EEEEPanel > row > cell > section > header
                    {background:#fcaf17;display:flex;flex-direction:row;}
                #EEEEPanel > row > cell > section > header > *
                    {border-right:1px black dotted;display:flex;justify-content:center;flex-direction:column;
                    padding:5px 10px;color:black;}
                #EEEEPanel > row > cell > section > header > *:last-child
                    {border-right:0;}
                #EEEEPanel > row > cell > section > header > h1
                    {font:17px arial narrow, sans-serif;font-weight:bold;text-transform:uppercase;
                    letter-spacing:1px;flex:1 1 auto;text-shadow:0 1px rgba(255,255,255,0.5)}
                #EEEEPanel > row > cell > section > header > button
                    {font:11px arial, sans-serif;font-weight:bold;text-transform:uppercase;flex:0 1 auto;}
                #EEEEPanel > row > cell > section > header > button:hover
                    {background:white;color:black;}
                #EEEEPanel > row > cell > section > header > button[disabled]
                    {opacity:0.5;pointer-events:none;}

                #EEEEPanel > row > cell > section > bod
                    {display:flex;flex-direction:column;padding:5px;}

                #EEEEPanel > row > cell > section > bod > row
                    {display:flex;flex-direction:row;}

                #EEEEPanel > row > cell > section > bod > row > :is(label, p)
                    {flex:0 1 auto;padding:3px 5px;align-self:center;font:13px/21px sans-serif;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > b
                    {font:inherit;font-weight:bold;display:inline;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > abbr
                    {font:inherit;display:inline;text-decoration:underline;text-decoration-style:dotted;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > a
                    {font:inherit;color:blue;text-decoration:underline;cursor:pointer;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > a[disabled]
                    {pointer-events:none;filter:grayscale(1);opacity:0.25;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > a:hover
                    {text-decoration:none;}

                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > select
                    {appearance:auto;font:inherit;background:white;color:black;
                    border:1px darkgray solid;padding:3px 8px;border-radius:100px;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > select[disabled]
                    {color:silver;pointer-events:none;border-color:darkgray;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > select > option
                    {appearance:auto;font:inherit;}

                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button
                    {font:13px/21px arial narrow, sans-serif;appearance:auto;background:#830f91;
                    border:1px #830f91 solid;color:white;letter-spacing:1px;font-weight:bold;padding:2px 9px;
                    border-radius:100px;white-space:nowrap;text-align:center;text-transform:uppercase;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button:hover
                    {background:#590A63}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button[disabled]
                    {background:gainsboro;color:darkgray;pointer-events:none;border-color:darkgray;}

                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button#EEEELightboxToggle
                    {flex:1 1 auto;border-radius:50%;}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button#EEEELightboxToggle::before
                    {content: '?';}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button#EEEELightboxToggle.hidden
                    {background-image:linear-gradient(to bottom, transparent 46%, white 46%, white 54%, transparent 54%);}
                #EEEEPanel > row > cell > section > bod > row > :is(label, p) > button#EEEELightboxToggle.hidden::before
                    {color:transparent;}
            </style>

            <div id="EEEEPageCover"></div>

            <article id="EEEEPanel">
                <row>
                    <cell style="width:290px;">
                        <section>
                            <header>
                                <h1>Batch</h1>
                                <button id="EEEELayersCount">Count Layers</button>
                            </header>
                            <bod>
                                <row id="EEEEBatchWaiting">
                                    <p style="flex:1 1 auto;display:flex;">
                                        <button disabled style="flex:1 1 auto;animation:EEEE-opacity-blink infinite ease-in-out 1s;">
                                            Waiting for commands...
                                        </button>
                                    </p>
                                </row>
                                <row id="EEEEBatchRunning">
                                    <label style="flex:1 1 auto;display:flex;">
                                        <button style="flex:1 1 100px;" id="EEEEPauseButton"></button>
                                    </label>
                                </row>
                                <row>
                                    <p style="flex-grow:1;text-align:justify;">
                                        Due to how browsers work, you must <b style="color:red;">keep this window focused and
                                        avoid using the keyboard</b> while running the batch process. However, you may <b>hover</b>
                                        the buttons in this section to control the application. Should the batch fail,
                                        or if you want to abort it, just refresh the page to reset the canvas to the last saved emblem.
                                    </p>
                                </row>
                            </bod>
                        </section>
                    </cell>
                    <cell style="width:300px;">
                        <section>
                            <header>
                                <h1>Lightbox</h1>
                            </header>
                            <bod>
                                <row>
                                    <label style="flex:1 1 auto;display:flex;">
                                        <button style="flex:1 1 auto;" id="EEEELightboxLoad">Load image</button>
                                    </label>
                                    <label style="flex:0 0 50px;display:flex;" title="Toggle visibility">
                                        <button style="flex:1 1 auto;border-radius:50%;" id="EEEELightboxToggle"></button>
                                    </label>
                                    <label style="flex:1 1 auto;display:flex;" title="Set luminosity">
                                        <select style="flex:1 1 auto;" id="EEEELightboxStrength">
                                            <option value="0.25">25%</option>
                                            <option value="0.50" selected>50%</option>
                                            <option value="0.75">75%</option>
                                            <option value="1.00">100%</option>
                                        </select>
                                    </label>
                                </row>
                                <row>
                                    <p>Add a semi-transparent <b>image overlay</b> as an aid for manually tracing shapes.</p>
                                </row>
                            </bod>
                        </section>

                        <section>
                            <header>
                                <h1>Backups</h1>
                            </header>
                            <bod>
                                <row>
                                    <label style="flex:1 1 auto;display:flex;">
                                        <button style="flex:1 1 auto;" id="EEEEBackupExport" title="Use Ctrl+Click to export uncompressed JSON.">Export</button>
                                    </label>
                                    <label style="flex:1 1 auto;display:flex;">
                                        <button style="flex:1 1 auto;" id="EEEEBackupImport">Import</button>
                                    </label>
                                    <p>
                                        <a href="https://github.com/Wes0617/EmblemEditorEE/blob/main/readme-import.md" target="_blank" id="EEEEBackupImportExamples">Examples</a>
                                    </p>
                                </row>
                                <row>
                                    <p>
                                        Export the Emblem to a <b>.eeee.txt</b> file, or import a <b>.eeee.txt</b> file into the canvas.
                                    </p>
                                </row>
                            </bod>
                        </section>
                    </cell>
                    <cell>
                        <section>
                            <header>
                                <h1>Scanner</h1>
                            </header>
                            <bod>
                                <row>
                                    <label style="flex:1 1 auto;display:flex;">
                                        <button style="flex:1 1 auto;" id="EEEEScannerLoad">Load Emblem from image</button>
                                    </label>
                                    <p>
                                        <a href="https://github.com/Wes0617/EmblemEditorEE/blob/main/readme-scanner.md" target="_blank" id="EEEEScannerExamples">Examples</a>
                                    </p>
                                </row>
                                <row>
                                    <p>
                                        <b>Create layers from a 32-bit PNG.</b> You may use 128x128, 64x64, 32x32 or 16x16 images,
                                        but keep in mind that the canvas only accepts ~800 opaque "pixels" (aka layers) in total.
                                        For example a 128x128 PNG should be used to draw text, lines, contours, etc.
                                        not to fill the entire canvas. For that, you'll need to use a mix of
                                        16, 32, 64 and 128 pixel images. Check out the examples under the
                                        Backups section for more info about this.
                                    </p>
                                </row>
                            </bod>
                        </section>
                    </cell>
                </row>
                <row>
                    <cell>
                        <section>
                            <bod>
                                <row>
                                    <p style="flex:1 1 auto;text-align:center">
                                        Use this at your own risk! Do not use this to create offensive Emblems!
                                        Do not abuse R?'s services! <a href="https://github.com/Wes0617/EmblemEditorEE" target="_blank" id="EEEEGithub">Project on GitHub</a>
                                    </p>
                                </row>
                            </bod>
                        </section>
                    </cell>
                </row>
            </article>
        `;
        document.body.insertAdjacentHTML("beforeend", EEEEPanelHTMLSource);

        // -------------------------------------------------------------------------------------------------------------

        // Locate the HTML Elements and define the state variables:

        let app = new EEWrapper();
        let layers = await app.layers();
        let shapes = await app.shapes();

        let HTMLCanvasContainer = qs(document, "#emblemEditor-canvasContainer", 1, 1)[0];

        let HTMLPageCover = qs(document, "#EEEEPageCover", 1, 1)[0];
        let HTMLPanel = qs(document, "#EEEEPanel", 1, 1)[0];
        let HTMLLayersCount = qs(document, "#EEEELayersCount", 1, 1)[0];
        let HTMLBatchWaiting = qs(document, "#EEEEBatchWaiting", 1, 1)[0];
        let HTMLBatchRunning = qs(document, "#EEEEBatchRunning", 1, 1)[0];
        let HTMLPauseButton = qs(document, "#EEEEPauseButton", 1, 1)[0];
        let HTMLLightboxLoad = qs(document, "#EEEELightboxLoad", 1, 1)[0];
        let HTMLLightboxToggle = qs(document, "#EEEELightboxToggle", 1, 1)[0];
        let HTMLLightboxStrength = qs(document, "#EEEELightboxStrength", 1, 1)[0];
        let HTMLBackupExport = qs(document, "#EEEEBackupExport", 1, 1)[0];
        let HTMLBackupImport = qs(document, "#EEEEBackupImport", 1, 1)[0];
        let HTMLBackupImportExamples = qs(document, "#EEEEBackupImportExamples", 1, 1)[0];
        let HTMLScannerLoad = qs(document, "#EEEEScannerLoad", 1, 1)[0];
        let HTMLScannerExamples = qs(document, "#EEEEScannerExamples", 1, 1)[0];
        let HTMLGithub = qs(document, "#EEEEGithub", 1, 1)[0];

        let paused = false;
        let running = false;
        let focused = document.hasFocus();

        async function nonPausedState(){
            return new Promise(function(resolve){
                function resolveIfNotPaused(){
                    if(paused){
                        setTimeout(resolveIfNotPaused, 500);
                    }else{
                        resolve();
                    }
                }
                resolveIfNotPaused();
            });
        }

        // -------------------------------------------------------------------------------------------------------------

        // Define the "collapsed" position of the panel:

        (function(){
            let headingHeight = qs(HTMLPanel, "header", 1)[0].offsetHeight;
            let border = 8;
            let bottom = HTMLPanel.offsetHeight - headingHeight - border - border;
            HTMLPanel.style.bottom = bottom * -1 + "px";
        })();

        // -------------------------------------------------------------------------------------------------------------
        // UPDATE UI ROUTINE
        // -------------------------------------------------------------------------------------------------------------

        let updateUI = await (async function(){
            function blockMouseDown(ev){
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                return false;
            }

            async function update(){
                if(running){
                    if(paused){
                        removeEventListener("mousedown", blockMouseDown, true);
                        HTMLPageCover.classList.remove("blocked");
                        HTMLBatchWaiting.style.display = "none";
                        HTMLBatchRunning.style.display = "";
                        HTMLLayersCount.removeAttribute("disabled");
                        HTMLLightboxLoad.removeAttribute("disabled");
                        HTMLLightboxToggle.removeAttribute("disabled");
                        HTMLLightboxStrength.removeAttribute("disabled");
                        HTMLBackupExport.setAttribute("disabled", "disabled");
                        HTMLBackupImport.setAttribute("disabled", "disabled");
                        HTMLScannerLoad.setAttribute("disabled", "disabled");
                        HTMLBackupImportExamples.removeAttribute("disabled");
                        HTMLScannerExamples.removeAttribute("disabled");
                        HTMLGithub.removeAttribute("disabled");
                        if(focused){
                            HTMLPauseButton.removeAttribute("disabled");
                        }else{
                            HTMLPauseButton.setAttribute("disabled", "disabled");
                        }
                    }else{
                        addEventListener("mousedown", blockMouseDown, true);
                        HTMLPageCover.classList.add("blocked");
                        HTMLBatchWaiting.style.display = "none";
                        HTMLBatchRunning.style.display = "";
                        HTMLLayersCount.setAttribute("disabled", "disabled");
                        HTMLLightboxLoad.setAttribute("disabled", "disabled");
                        HTMLLightboxToggle.setAttribute("disabled", "disabled");
                        HTMLLightboxStrength.setAttribute("disabled", "disabled");
                        HTMLBackupExport.setAttribute("disabled", "disabled");
                        HTMLBackupImport.setAttribute("disabled", "disabled");
                        HTMLScannerLoad.setAttribute("disabled", "disabled");
                        HTMLBackupImportExamples.setAttribute("disabled", "disabled");
                        HTMLScannerExamples.setAttribute("disabled", "disabled");
                        HTMLGithub.setAttribute("disabled", "disabled");

                        HTMLPauseButton.removeAttribute("disabled");
                    }
                }else{
                    removeEventListener("mousedown", blockMouseDown, true);
                    HTMLPageCover.classList.remove("blocked");
                    HTMLBatchWaiting.style.display = "";
                    HTMLBatchRunning.style.display = "none";
                    HTMLLayersCount.removeAttribute("disabled");
                    HTMLLightboxLoad.removeAttribute("disabled");
                    HTMLLightboxToggle.removeAttribute("disabled");
                    HTMLLightboxStrength.removeAttribute("disabled");
                    HTMLBackupExport.removeAttribute("disabled");
                    HTMLBackupImport.removeAttribute("disabled");
                    HTMLScannerLoad.removeAttribute("disabled");
                    HTMLBackupImportExamples.removeAttribute("disabled");
                    HTMLScannerExamples.removeAttribute("disabled");
                    HTMLGithub.removeAttribute("disabled");

                    HTMLPauseButton.removeAttribute("disabled");
                }
            };

            await update();

            return update;
        })();

        // -------------------------------------------------------------------------------------------------------------
        // PAUSE APP CONTROL
        // -------------------------------------------------------------------------------------------------------------

        addEventListener("focus", async function(ev){
            if(ev.target !== window) return;
            focused = true;
            await updateUI();
        }, true);

        addEventListener("blur", async function(ev){
            if(ev.target !== window) return;
            focused = false;
            await updateUI();
        }, true);

        (function(){

            let hovered = false;

            HTMLPauseButton.textContent = "Paused: " + (paused ? "YES" : "NO");

            let timeout;
            HTMLPauseButton.addEventListener("mouseover", function(ev){
                if(hovered) return;
                hovered = true;
                HTMLPauseButton.textContent = "Paused: .";
                clearTimeout(timeout);
                timeout = setTimeout(function(){
                    HTMLPauseButton.textContent = "Paused: ..";
                    clearTimeout(timeout);
                    timeout = setTimeout(function(){
                        HTMLPauseButton.textContent = "Paused: ...";
                        clearTimeout(timeout);
                        timeout = setTimeout(async function(){
                            paused = !paused;
                            HTMLPauseButton.textContent = "Paused: " + (paused ? "YES" : "NO");
                            await updateUI();
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, true);
            HTMLPauseButton.addEventListener("mouseout", function(ev){
                if(!hovered) return;
                hovered = false;
                clearTimeout(timeout);
                HTMLPauseButton.textContent = "Paused: " + (paused ? "YES" : "NO");
            }, true);
        })();

        // -------------------------------------------------------------------------------------------------------------
        // LAYER COUNT
        // -------------------------------------------------------------------------------------------------------------

        HTMLLayersCount.addEventListener("click", async function(){
            await Modals.message("The canvas uses " + await layers.count() + " of the ~800 layer slots available.");
        }, true);

        // -------------------------------------------------------------------------------------------------------------
        // LIGHTBOX CONTROLS
        // -------------------------------------------------------------------------------------------------------------

        (function(){
            let HTMLLightbox = document.createElement("img");
            HTMLLightbox.id = "EEEELightbox";
            HTMLCanvasContainer.appendChild(HTMLLightbox);
            HTMLLightbox.style.display = "none";
            HTMLLightbox.style.opacity = "0.5";

            HTMLLightboxLoad.addEventListener("click", async function(){
                let HTMLFile = document.createElement("input");
                HTMLFile.type="file";
                HTMLFile.accept = ".png,.jpg,.jpeg,.gif,.webp";
                HTMLFile.addEventListener("change", async function(){
                    if(HTMLFile.files.length !== 1){
                        return;
                    }

                    let reader = new FileReader();
                    reader.addEventListener("load", async function(event){
                        let HTMLImage = new Image();

                        HTMLImage.addEventListener("error", async function(){
                            await Modals.warning("The file you selected is not a supported image.");
                        }, true);

                        HTMLImage.addEventListener("load", async function(){
                            if(HTMLImage.width !== HTMLImage.height){
                                await Modals.warning("Please select an image with 1:1 aspect ratio.");
                                return;
                            }

                            HTMLLightbox.src = this.src;
                            HTMLLightbox.style.display = "block";
                        }, true);

                        HTMLImage.src = event.target.result;
                    }, true);

                    reader.readAsDataURL(HTMLFile.files[0]);
                }, true);
                HTMLFile.click();
            }, true);

            HTMLLightboxStrength.addEventListener("change", async function(){
                HTMLLightbox.style.opacity = HTMLLightboxStrength.value;
            }, true);

            HTMLLightboxToggle.addEventListener("click", async function(){
                if(HTMLLightboxToggle.classList.contains("hidden")){
                    HTMLLightboxToggle.classList.remove("hidden");
                    HTMLLightbox.style.visibility = "visible";
                }else{
                    HTMLLightboxToggle.classList.add("hidden");
                    HTMLLightbox.style.visibility = "hidden";
                }
            }, true);
        })();

        // -------------------------------------------------------------------------------------------------------------
        // IMPORT / EXPORT CONTROLS
        // -------------------------------------------------------------------------------------------------------------

        HTMLBackupExport.addEventListener("click", async function(ev){
            await Modals.message(
                "Exporting may take a few seconds.\n"+
                "Keep the window focused during the operation or it will fail.\n"+
                "This emblem contains " + await layers.count() + " layers."
            );
            running = true;
            await updateUI();
            let fileName = "emblem" + new Date().getTime() + ".eeee.txt";
            let data = await layers.serializeToJSON(nonPausedState);
            Modals.downloadTextFile(fileName, data);
            running = false;
            await updateUI();
        });

        HTMLBackupImport.addEventListener("click", async function(ev){
            let HTMLFile = document.createElement("input");
            HTMLFile.type="file";
            HTMLFile.accept = ".eeee.txt";
            HTMLFile.addEventListener("change", async function(){
                if(HTMLFile.files.length !== 1){
                    return;
                }

                let reader = new FileReader();

                reader.addEventListener("error", async function(){
                    await Modals.warning("The provided file could not be read.");
                }, true);

                reader.addEventListener("load", async function(event){
                    let serializedLayers;

                    try{
                        serializedLayers = JSON.parse(event.target.result);
                    }catch(e){
                        await Modals.warning("The provided file could not be read as JSON.");
                        return;
                    }

                    if(!Array.isArray(serializedLayers)){
                        await Modals.warning("The provided file does not appear to contain a valid Emblem.");
                        return;
                    }

                    if(!(await Modals.confirmImport(await layers.count(), serializedLayers.length))){
                        return;
                    }

                    running = true;
                    await updateUI();
                    for(let serializedLayer of serializedLayers){
                        if(typeof serializedLayer !== "object"){
                            Modals.error(new Error("The provided file does not appear to contain a valid Emblem."));
                            return;
                        }
                        await app.addSerialized(serializedLayer);
                        await nonPausedState();
                    }
                    running = false;
                    await updateUI();
                }, true);
                reader.readAsText(HTMLFile.files[0]);
            }, true);
            HTMLFile.click();
        });

        // -------------------------------------------------------------------------------------------------------------
        // SCANNER CONTROLS
        // -------------------------------------------------------------------------------------------------------------

        HTMLScannerLoad.addEventListener("click", async function(){
            let HTMLFile = document.createElement("input");
            HTMLFile.type="file";
            HTMLFile.accept = ".png";
            HTMLFile.addEventListener("change", async function(){
                if(HTMLFile.files.length !== 1){
                    return;
                }

                let reader = new FileReader();
                reader.onload = async function(event){
                    let HTMLImage = new Image();

                    HTMLImage.addEventListener("error", async function(){
                        await Modals.warning("The file you selected is not a recognized or valid PNG image.");
                    }, true);

                    HTMLImage.addEventListener("load", async function(){
                        if(HTMLImage.width !== HTMLImage.height || ![16, 32, 64, 128].includes(HTMLImage.width)){
                            await Modals.warning("Please select a PNG image file that is 16x16, 32x32, 64x64 or 128x128.");
                            return;
                        }

                        let canvas = new EEEEScannerCanvas(HTMLImage);

                        if(!(await Modals.confirmImport(await layers.count(), canvas.countOpaquePixels()))){
                            return;
                        }

                        running = true;
                        await updateUI();
                        for(let y = 0; y < HTMLImage.width; y++){
                            for(let x = 0; x < HTMLImage.width; x++){
                                let pixel = canvas.pixelAt(x, y);
                                if(pixel !== null){
                                    await app.addPixel(HTMLImage.width, x, y, pixel.hex, pixel.opacity);
                                    await nonPausedState();
                                }
                            }
                        }
                        running = false;
                        await updateUI();
                    }, true);

                    HTMLImage.src = event.target.result;
                };

                reader.readAsDataURL(HTMLFile.files[0]);
            }, true);
            HTMLFile.click();
        });

        // -------------------------------------------------------------------------------------------------------------

    }

    main();

})();