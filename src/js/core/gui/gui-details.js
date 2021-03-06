/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Text_class from './../../tools/text.js';

var template = `
	<div class="row">
		<span class="trn label">X</span>
		<input type="number" id="detail_x" />
		<button class="extra reset" type="button" id="reset_x" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Y:</span>
		<input type="number" id="detail_y" />
		<button class="extra reset" type="button" id="reset_y" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Width:</span>
		<input type="number" id="detail_width" />
		<button class="extra reset" type="button" id="reset_size" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Height:</span>
		<input type="number" id="detail_height" />
	</div>
	<hr />
	<div class="row">
		<span class="trn label">Rotate:</span>
		<input type="number" min="-360" max="360" id="detail_rotate" />
	</div>
	<div class="row">
		<span class="trn label">Opacity:</span>
		<input type="number" min="0" max="100" id="detail_opacity" />
	</div>
	<div class="row">
		<span class="trn label">Color:</span>
		<input style="padding: 0px;" type="color" id="detail_color" />
	</div>
	<div id="text_detail_params">
		<hr />
		<div class="row">
			<span class="trn label">&nbsp;</span>
			<button type="button" class="trn dots" id="detail_param_text">Edit text...</button>
		</div>
		<div class="row">
			<span class="trn label" title="Resize Boundary">Bounds:</span>
			<select id="detail_param_boundary">
				<option value="box">Box</option>
				<option value="dynamic">Dynamic</option>
			</select>
		</div>
		<div class="row" hidden> <!-- Future implementation -->
			<span class="trn label">Direction:</span>
			<select id="detail_param_text_direction">
				<option value="ltr">Left to Right</option>
				<option value="rtl">Right to Left</option>
				<option value="ttb">Top to Bottom</option>
				<option value="btt">Bottom to Top</option>
			</select>
		</div>
		<div class="row" hidden> <!-- Future implementation -->
			<span class="trn label">Wrap:</span>
			<select id="detail_param_wrap_direction">
				<option value="ltr">Left to Right</option>
				<option value="rtl">Right to Left</option>
				<option value="ttb">Top to Bottom</option>
				<option value="btt">Bottom to Top</option>
			</select>
		</div>
		<div class="row">
			<span class="trn label">Wrap At:</span>
			<select id="detail_param_wrap">
				<option value="letter">Word + Letter</option>
				<option value="word">Word</option>
			</select>
		</div>
		<div class="row">
			<span class="trn label" title="Horizontal Alignment">H. Align:</span>
			<select id="detail_param_halign">
				<option value="left">Left</option>
				<option value="center">Center</option>
				<option value="right">Right</option>
			</select>
		</div>
		<div class="row" hidden> <!-- Future implementation -->
			<span class="trn label" title="Vertical Alignment">V. Align:</span>
			<select id="detail_param_valign">
				<option value="top">Top</option>
				<option value="middle">Middle</option>
				<option value="bottom">Bottom</option>
			</select>
		</div>
	<div>
`;

/**
 * GUI class responsible for rendering selected layer details block on right sidebar
 */
class GUI_details_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Text = new Text_class();
	}

	render_main_details() {
		document.getElementById('toggle_details').innerHTML = template;

		this.render_details(true);
	}

	render_details(events = false) {
		this.render_general('x', events);
		this.render_general('y', events);
		this.render_general('width', events);
		this.render_general('height', events);

		this.render_general('rotate', events);
		this.render_general('opacity', events);
		this.render_color(events);
		this.render_reset(events);

		//text - special case
		if (config.layer != undefined && config.layer.type == 'text') {
			document.getElementById('text_detail_params').style.display = 'block';
			document.getElementById('detail_color').closest('.row').style.display = 'none';
		}
		else {
			document.getElementById('text_detail_params').style.display = 'none';
			document.getElementById('detail_color').closest('.row').style.display = 'block';
		}
		this.render_text(events);
		this.render_general_select_param('boundary', events);
		this.render_general_select_param('text_direction', events);
		this.render_general_select_param('wrap', events);
		this.render_general_select_param('wrap_direction', events);
		this.render_general_select_param('halign', events);
		this.render_general_select_param('valign', events);
	}

	render_general(key, events) {
		var layer = config.layer;

		if (layer != undefined) {
			var target = document.getElementById('detail_' + key);
			if (layer[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				target.value = Math.round(layer[key]);
				target.disabled = false;
			}
		}

		if (events) {
			//events
			var target = document.getElementById('detail_' + key);
			if(target == undefined){
				console.log('Error: missing details event target ' + 'detail_' + key);
				return;
			}
			target.addEventListener('change', function (e) {
				var value = parseInt(this.value);
				
				if(this.min != undefined && this.min != '' && value < this.min){
					document.getElementById('detail_opacity').value = value;
					value = this.min;
				}
				if(this.max != undefined && this.min != '' && value > this.max){
					document.getElementById('detail_opacity').value = value;
					value = this.max;
				}
				
				config.layer[key] = value;
				config.need_render = true;
			});
			target.addEventListener('keyup', function (e) {
				//for edge....
				if (e.keyCode != 13) 
					return;
				var value = parseInt(this.value);
				
				if(this.min != undefined && this.min != '' && value < this.min){
					document.getElementById('detail_opacity').value = value;
					value = this.min;
				}
				if(this.max != undefined && this.min != '' && value > this.max){
					document.getElementById('detail_opacity').value = value;
					value = this.max;
				}
				
				config.layer[key] = value;
				config.need_render = true;
			});
		}
	}

	render_general_param(key, events) {
		var layer = config.layer;

		if (layer != undefined) {
			var target = document.getElementById('detail_param_' + key);
			if (layer.params[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				if (typeof layer.params[key] == 'boolean') {
					//boolean
					if(target.tagName == 'BUTTON'){
						if(layer.params[key]){
							target.classList.add('active');
						}
						else{
							target.classList.remove('active');
						}
					}
				}
				else {
					//common
					target.value = layer.params[key];
				}
				target.disabled = false;
			}
		}

		if (events) {
			//events
			document.getElementById('detail_param_' + key).addEventListener('change', function (e) {
				var value = parseInt(this.value);
				config.layer.params[key] = value;
				config.need_render = true;
				config.need_render_changed_params = true;

			});
			document.getElementById('detail_param_' + key).addEventListener('click', function (e) {
				if (typeof config.layer.params[key] != 'boolean')
					return;
				this.classList.toggle('active');
				config.layer.params[key] = !config.layer.params[key];
				config.need_render = true;
				config.need_render_changed_params = true;
			});
		}
	}
	
	render_general_select_param(key, events){
		var layer = config.layer;

		if (layer != undefined) {
			var target = document.getElementById('detail_param_' + key);
			
			if (layer.params[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				if(typeof layer.params[key] == 'object')
					target.value = layer.params[key].value; //legacy
				else
					target.value = layer.params[key];
				target.disabled = false;
			}
		}

		if (events) {
			//events
			document.getElementById('detail_param_' + key).addEventListener('change', function (e) {
				var value = this.value;
				config.layer.params[key] = value;
				config.need_render = true;
				config.need_render_changed_params = true;
			});
		}
	}

	/**
	 * item: color
	 */
	render_color(events) {
		var layer = config.layer;

		if (layer != undefined) {
			document.getElementById('detail_color').value = layer.color;
		}

		if (events) {
			//events
			document.getElementById('detail_color').addEventListener('change', function (e) {
				var value = this.value;
				config.layer.color = value;
				config.need_render = true;
				config.need_render_changed_params = true;
			});
		}
	}

	/**
	 * item: size reset button
	 */
	render_reset(events) {
		var layer = config.layer;

		if (layer != undefined) {
			//size
			if (layer.width_original != null) {
				document.getElementById('reset_size').classList.remove('hidden');
			}
			else {
				document.getElementById('reset_size').classList.add('hidden');
			}
		}

		if (events) {
			//events
			document.getElementById('reset_x').addEventListener('click', function (e) {
				if(config.layer.x != null)
					config.layer.x = 0;
				config.need_render = true;
				config.need_render_changed_params = true;
			});
			document.getElementById('reset_y').addEventListener('click', function (e) {
				if(config.layer.x != null)
					config.layer.y = 0;
				config.need_render = true;
				config.need_render_changed_params = true;
			});
			document.getElementById('reset_size').addEventListener('click', function (e) {
				config.layer.width = config.layer.width_original;
				config.layer.height = config.layer.height_original;
				config.need_render = true;
				config.need_render_changed_params = true;
			});
		}
	}

	/**
	 * item: text
	 */
	render_text(events) {
		if (events) {
			//events
			document.getElementById('detail_param_text').addEventListener('click', function (e) {
				document.querySelector('#tools_container #text').click();
				document.getElementById('text_tool_keyboard_input').focus();
			});
		}
	}

}

export default GUI_details_class;
