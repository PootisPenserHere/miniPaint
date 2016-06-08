/* global MAIN, POP, LAYER, EXIF, HELPER, IMAGE, GUI */
/* global SAVE_TYPES */

var FILE = new FILE_CLASS();

/** 
 * manages files actions
 * 
 * @author ViliusL
 */
function FILE_CLASS() {

	/**
	 * exif data
	 */
	this.EXIF = false;
	
	/**
	 * default name used for saving file
	 */
	this.SAVE_NAME = 'example';			//default save name
	
	/**
	 * save types config
	 */
	this.SAVE_TYPES = [
		"PNG - Portable Network Graphics",	//default
		"JPG - JPG/JPEG Format",		//autodetect on photos where png useless?
		"JSON - Full layers data",		//aka PSD
		"BMP - Windows Bitmap",			//firefox only, useless?
		"WEBP - Weppy File Format",		//chrome only
		];
	//new
	this.file_new = function () {
		POP.add({name: "width", title: "Width:", value: WIDTH});
		POP.add({name: "height", title: "Height:", value: HEIGHT});
		POP.add({name: "transparency", title: "Transparent:", values: ['Yes', 'No']});
		POP.show(
			'New file...', 
			function (response) {
				var width = parseInt(response.width);
				var height = parseInt(response.height);

				if (response.transparency == 'Yes')
					GUI.TRANSPARENCY = true;
				else
					GUI.TRANSPARENCY = false;

				GUI.ZOOM = 100;
				WIDTH = width;
				HEIGHT = height;
				MAIN.init();
			}
		);
	};

	//open
	this.file_open = function () {
		this.open();
	};

	//save
	this.file_save = function () {
		this.save_dialog();
	};

	//print
	this.file_print = function () {
		window.print();
	};

	this.open = function () {
		document.getElementById("tmp").innerHTML = '';
		var a = document.createElement('input');
		a.setAttribute("id", "file_open");
		a.type = 'file';
		a.multiple = 'multiple ';
		document.getElementById("tmp").appendChild(a);
		document.getElementById('file_open').addEventListener('change', this.open_handler, false);

		//force click
		document.querySelector('#file_open').click();
	};
	
	this.open_handler = function (e) {
		var files = e.target.files;
		for (var i = 0, f; i < files.length; i++) {
			f = files[i];
			if (!f.type.match('image.*') && f.type != 'text/json')
				continue;
			if (files.length == 1)
				this.SAVE_NAME = f.name.split('.')[f.name.split('.').length - 2];

			var FR = new FileReader();
			FR.file = e.target.files[i];

			FR.onload = function (event) {
				if (this.file.type.match('image.*')) {
					//image
					LAYER.layer_add(this.file.name, event.target.result, this.file.type);
					EXIF.getData(this.file, this.save_EXIF);
				}
				else {
					//json
					var responce = FILE.load_json(event.target.result);
					if (responce === true)
						return false;
				}
			};
			if (f.type == "text/plain")
				FR.readAsText(f);
			else if (f.type == "text/json")
				FR.readAsText(f);
			else
				FR.readAsDataURL(f);
		}
	};

	this.save_dialog = function (e) {
		//find default format
		var save_default = this.SAVE_TYPES[0];	//png
		if (HELPER.getCookie('save_default') == 'jpg')
			save_default = this.SAVE_TYPES[1]; //jpg

		POP.add({name: "name", title: "File name:", value: this.SAVE_NAME});
		POP.add({name: "type", title: "Save as type:", values: this.SAVE_TYPES, value: save_default});
		POP.add({name: "quality", title: "Quality (jpeg):", value: 90, range: [1, 100]});
		POP.add({name: "layers", title: "Save layers:", values: ['All', 'Selected']});
		POP.add({name: "trim", title: "Trim:", values: ['No', 'Yes']});
		POP.show('Save as ...', [FILE, 'save']);
		document.getElementById("pop_data_name").select();
		if (e != undefined)
			e.preventDefault();
	};

	this.save = function (user_response) {
		fname = user_response.name;
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		var save_mode_for_ie = false;
		if(window.Blob && window.navigator.msSaveOrOpenBlob && window.FileReader)
			save_mode_for_ie = true;
		tempCanvas.width = WIDTH;
		tempCanvas.height = HEIGHT;

		//save choosen type
		var save_default = this.SAVE_TYPES[0];	//png
		if (HELPER.getCookie('save_default') == 'jpg')
			save_default = this.SAVE_TYPES[1]; //jpg
		if (user_response.type != save_default && user_response.type == this.SAVE_TYPES[0])
			HELPER.setCookie('save_default', 'png', 30);
		else if (user_response.type != save_default && user_response.type == this.SAVE_TYPES[1])
			HELPER.setCookie('save_default', 'jpg', 30);

		//detect type
		var parts = user_response.type.split(" ");
		user_response.type = parts[0];

		if (HELPER.strpos(fname, '.png') !== false)
			user_response.type = 'PNG';
		else if (HELPER.strpos(fname, '.jpg') !== false)
			user_response.type = 'JPG';
		else if (HELPER.strpos(fname, '.json') !== false)
			user_response.type = 'JSON';
		else if (HELPER.strpos(fname, '.bmp') !== false)
			user_response.type = 'BMP';
		else if (HELPER.strpos(fname, '.webp') !== false)
			user_response.type = 'WEBP';

		//handle transparency
		if (GUI.TRANSPARENCY == false || user_response.type == 'JPG') {
			tempCtx.beginPath();
			tempCtx.rect(0, 0, WIDTH, HEIGHT);
			tempCtx.fillStyle = "#ffffff";
			tempCtx.fill();
		}

		//take data
		for (var i in LAYER.layers) {
			if (LAYER.layers[i].visible == false)
				continue;
			if (user_response.layers == 'Selected' && user_response.type != 'JSON' && i != LAYER.layer_active)
				continue;
			tempCtx.drawImage(document.getElementById(LAYER.layers[i].name), 0, 0, WIDTH, HEIGHT);
		}

		if (user_response.trim == 'Yes' && user_response.type != 'JSON') {
			//trim
			var trim_info = IMAGE.trim_info(tempCanvas);
			tmp_data = tempCtx.getImageData(0, 0, WIDTH, HEIGHT);
			tempCtx.clearRect(0, 0, WIDTH, HEIGHT);
			tempCanvas.width = WIDTH - trim_info.right - trim_info.left;
			tempCanvas.height = HEIGHT - trim_info.bottom - trim_info.top;
			tempCtx.putImageData(tmp_data, -trim_info.left, -trim_info.top);
		}

		//prepare data
		var data;
		if (user_response.type == 'PNG') {
			//png - default format
			var data_header = "image/png";
			if (HELPER.strpos(fname, '.png') == false)
				fname = fname + ".png";
			if(save_mode_for_ie == false)
				data = tempCanvas.toDataURL("image/png");
		}
		else if (user_response.type == 'JPG') {
			//jpg
			var quality = parseInt(user_response.quality);
			if (quality > 100 || quality < 1 || isNaN(quality) == true)
				quality = 90;
			quality = quality / 100;
			var data_header = "image/jpeg";
			if (HELPER.strpos(fname, '.jpg') == false)
				fname = fname + ".jpg";
			if(save_mode_for_ie == false)
				data = tempCanvas.toDataURL('image/jpeg', quality);
		}
		else if (user_response.type == 'BMP') {
			//bmp - lets hope user really needs this - chrome do not support it
			var data_header = "image/bmp";
			if (HELPER.strpos(fname, '.bmp') == false)
				fname = fname + ".bmp";
			if(save_mode_for_ie == false)
				data = tempCanvas.toDataURL("image/bmp");
		}
		else if (user_response.type == 'WEBP') {
			//WEBP - new format for chrome only
			if (HELPER.strpos(fname, '.webp') == false)
				fname = fname + ".webp";
			var data_header = "image/webp";
			if(save_mode_for_ie == false)
				data = tempCanvas.toDataURL("image/webp");
		}
		else if (user_response.type == 'JSON') {
			//json - full data with layers
			if(save_mode_for_ie == false){
				if (HELPER.strpos(fname, '.json') == false)
					fname = fname + ".json";
				var data_header = "text/plain";

				var export_data = {};

				//basic info
				export_data.info = {
					width: WIDTH,
					height: HEIGHT,
				};

				//layers
				export_data.layers = [];
				for (var i in LAYER.layers) {
					var layer = {
						name:LAYER.layers[i].name, 
						visible: 1,
						opacity: LAYER.layers[i].opacity,
					};
					if (LAYER.layers[i].visible == false)
						layer.visible = 0;
					export_data.layers.push(layer);
				}

				//image data
				export_data.image_data = [];
				for (var i in LAYER.layers) {
					var data_tmp = document.getElementById(LAYER.layers[i].name).toDataURL("image/png");
					export_data.image_data.push({name: LAYER.layers[i].name, data: data_tmp});
				}

				var data_json = JSON.stringify(export_data, null, 6);
				delete export_data;

				var bb = new Blob([data_json], {type: data_header});
				var data = window.URL.createObjectURL(bb);
			}
		}
		else{
			return false;
		}
		
		//download
		if(save_mode_for_ie == true){
			//IE10+ and Edge - but only as PNG
			if (user_response.type == 'PNG') {
				window.navigator.msSaveBlob(tempCanvas.msToBlob(), fname);
			}
			else if (user_response.type == 'JPG') {
				var image = tempCanvas.toDataURL("image/jpeg");
				image = HELPER.b64toBlob(image.replace("data:image/jpeg;base64,",""),"image/jpeg");
				return navigator.msSaveBlob(image, fname);
			}
			else{
				//error - no support
				POP.add({title: "Error:", value: "Format " + user_response.type+" is not supported in this browser"});
				POP.show('Sorry', '');
				return false;
			}
		}
		else{
			//download for firefox, chrome, chrome
			
			//check file format support
			var actualType = data.replace(/^data:([^;]*).*/, '$1');
			if (data_header != actualType && data_header != "text/plain") {
				//error - no support
				POP.add({title: "Error:", value: "Your browser do not support " + user_response.type});
				POP.show('Sorry', '');
				return false;
			}
			
			window.URL = window.webkitURL || window.URL;
			var a = document.createElement('a');
			var _this = this;
			if (typeof a.download != "undefined") {
				//a.download is supported
				a.setAttribute("id", "save_data");
				a.download = fname;
				a.href = data;
				a.textContent = 'Downloading...';
				document.getElementById("tmp").appendChild(a);

				//release memory
				a.onclick = function (e) {
					_this.save_cleanup(this);
				};
				//force click
				document.querySelector('#save_data').click();
			}
			else {
				//no support for a[download] attribute ...
				if (user_response.type == 'PNG')
					window.open(data);
				else if (user_response.type == 'JPG')
					window.open(data, quality);
			}
		}
	};
	
	this.save_cleanup = function (a) {
		a.textContent = 'Downloaded';
		setTimeout(function () {
			a.href = '';
			var element = document.getElementById("save_data");
			element.parentNode.removeChild(element);
		}, 1500);
	};
	
	this.save_EXIF = function () {
		this.EXIF = this.exifdata;
		//check length
		var n = 0;
		for (var i in this.EXIF){
			n++;
		}
		if (n == 0)
			this.EXIF = false;
	};
	
	this.load_json = function (data) {
		var json = JSON.parse(data);
		
		//delete old layers
		for (var i in LAYER.layers)
			LAYER.layer_remove(i);

		//init new file
		GUI.ZOOM = 100;
		MAIN.init();

		//set attributes
		WIDTH = parseInt(json.info.width);
		HEIGHT = parseInt(json.info.height);
		LAYER.set_canvas_size();

		//add layers
		for(var i in json.layers){
			var layer = json.layers[i];
			var name = layer.name.replace(/[^0-9a-zA-Z-_\. ]/g, "");
			var visible = parseInt(layer.visible);
			var opacity = parseInt(layer.opacity);

			if (i > 0) {	//first layer exists by default - Background
				LAYER.layer_add(name);
				//update attributes
				LAYER.layers[LAYER.layer_active].name = name;
				if (visible == 0)
					LAYER.layer_visibility(LAYER.layer_active);
				LAYER.layers[LAYER.layer_active].opacity = opacity;
			}
		}
		LAYER.layer_renew();
	
		for(var i in json.image_data){
			var layer = json.image_data[i];
			var name = layer.name.replace(/[^0-9a-zA-Z-_\. ]/g, "");
			var data = layer.data;

			var img = new Image();
			img.onload = (function(name, value){
				return function(){
					document.getElementById(name).getContext('2d').drawImage(value, 0, 0);

					LAYER.layer_renew();
					GUI.zoom();
				};
			})(name, img);
			img.src = data;
		}
	};

}