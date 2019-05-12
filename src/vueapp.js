var VueApp = function (app)
{
    Vue.component('v-select', VueSelect.VueSelect);

    this.app = app;
    this.breadboard = null;
    this.activeModal = { value: "" };
    this.filename = { value: "" };
    this.files = [];

    var outputs = this.outputs = new Array(256);
    var i;
    for (i = 0; i < 256; i += 1)
    {
        outputs[i] = 0;
    }

    var nodes = new Array(8);

    function toggleBit(v, i)
    {
        var mask = 1 << i;
        return (v & ~mask) | ((v ^ mask) & mask);
    }

    Vue.component('byterenderer', {
        props: {
            'canedit': Boolean,
            'byte': Number,
            'imgOn': String,
            'imgOff': String
        },
        data: function () {
            return {
                nodes: nodes
            };
        },
        template: `
<span>
<input v-bind:readonly="!canedit"
       v-model.number="byte"
       type="number"
       class="number-input"></input>
<img
    v-for="(item, index) in nodes"
    v-bind:src="((byte & (1 << (7 - index))) != 0) ? imgOn : imgOff"
    v-on:click="clickBit(7 - index)"
    class="node-img"
    size="3"
></img>
</span>`,
        watch: {
            byte: function () {
                this.byte = this.byte & 255;
                this.$emit('change', this.byte);
            }
        },
        methods: {
            clickBit: function (i) {
                if (this.canedit)
                {
                    this.$emit('change', toggleBit(this.byte, i));
                }
            }
        }
    });

    Vue.component('chipoutput', {
        props: ['outputs'],
        template: `
<div>
<byterenderer v-bind:canedit=true v-bind:byte=address v-on:change=changeAddress imgOn="assets/inputnode-on.png" imgOff="assets/inputnode-off.png"></byterenderer>
<byterenderer v-bind:canedit=true v-bind:byte=output v-on:change=changeValue imgOn="assets/node-on.png" imgOff="assets/node-off.png"></byterenderer>
</div>
`,
        data: function () {
            return {
                output: 0,
                address: 0
            };
        },
        watch: {
            address: function () {
                this.address = this.address & 255;
                this.output = this.outputs[this.address];
            },
            output: function () {
                this.$emit('change', this.address, this.output & 255);
            },
            outputs: function () {
                this.output = this.outputs[this.address];
            }
        },
        methods: {
            changeAddress: function (v) {
                this.address = v & 255;
                this.output = this.outputs[this.address];
            },
            changeValue: function (v) {
                this.$emit('change', this.address, v & 255);
            }
        }
    });


    Vue.component('chipline', {
        props: ['address', 'output'],
        template: `
<div>
<byterenderer v-bind:canedit=false v-bind:byte=address imgOn="assets/inputnode-on.png" imgOff="assets/inputnode-off.png"></byterenderer>
<byterenderer v-bind:canedit=true v-bind:byte=output v-on:change=changeValue imgOn="assets/node-on.png" imgOff="assets/node-off.png"></byterenderer>
</div>
`,
        data: function () {
            return {};
        },
        watch: {
            output: function () {
                this.$emit('change', this.address, this.output & 255);
            }
        },
        methods: {
            changeValue: function (v) {
                this.$emit('change', this.address, v & 255);
            }
        }
    });

    Vue.component('tab-edit', {
        template: "#tab-edit",
        data: function ()
        {
            return {
                outputs: outputs
            }
        },
        methods: {
            outputChanged: function (address, output)
            {
                Vue.set(this.outputs, address, output);
            }
        }
    });

    var webworker = null;
    var webworkerUrl = "";
    var code = {value: `function generate()
{
    var outputs = new Uint8Array(256);
    return outputs;
}`};

    Vue.component('tab-javascript', {
        template: "#tab-javascript",
        data: function ()
        {
            return {
                generateButton: "Generate",
                generateText: "",
                code: code,
                cmOption: {
                    indentUnit: 4,
                    tabSize: 4,
                    lineNumbers: true,
                    mode: 'text/javascript'
                }
            };
        },
        methods: {
            clickCheck: function()
            {
                JSHINT(this.code.value);
                var jshintData = JSHINT.data();
                var i;
                var msg = "";
                if (jshintData.errors)
                {
                    for (i = 0; i < jshintData.errors.length; i += 1)
                    {
                        var error = jshintData.errors[i];
                        msg += "Error " + error.code + " on line " + error.line + ":" + error.character + " \"" + error.reason  + "\"\n";
                        msg += error.evidence + "\n\n";
                    }
                }
                else
                {
                    msg += "No JsHint errors";
                }

                var found = false;
                if (jshintData.functions)
                {
                    for (i = 0; i < jshintData.functions.length; i += 1)
                    {
                        if (jshintData.functions[i].name == "generate")
                        {
                            found = true;
                            break;
                        }
                    }
                }

                if (!found)
                {
                    msg += "Missing \"generate\" function";
                }
                this.generateText = msg;
            },
            clickGenerate: function ()
            {
                var that = this;
                if (webworker)
                {
                    that.generateText = "Generation stopped";
                    that.generateButton = "Generate";
                    webworker.terminate();
                    webworker = null;
                    return;
                }

                window.URL = window.URL || window.webkitURL;

                var response = this.code.value + `
self.onmessage=function(e){
    try
    {
        postMessage(generate());
    }
    catch (err)
    {
        postMessage({msg: err.message, stack: err.stack});
    }
}`;

                var blob;
                try {
                    blob = new Blob([response], {type: 'application/javascript'});
                } catch (e) { // Backwards-compatibility
                    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                    blob = new BlobBuilder();
                    blob.append(response);
                    blob = blob.getBlob();
                }
                webworkerUrl = URL.createObjectURL(blob);
                try
                {
                    webworker = new Worker(webworkerUrl);
                }
                catch (err)
                {
                    this.generateText = err.stack;
                    return;
                }

                webworker.onerror = function(e)
                {
                    that.generateText = e.message;
                    that.generateButton = "Generate";
                    webworker.terminate();
                    webworker = null;
                }

                this.generateText = "Generating...";
                this.generateButton = "Stop";

                // Test, used in all examples:
                webworker.onmessage = function(e) {
                    if (e.data.constructor === Uint8Array && e.data.length === 256)
                    {
                        that.generateText = "Success!";
                        var i;
                        for (i = 0; i < 256; i += 1)
                        {
                            Vue.set(outputs, i, e.data[i]);
                        }
                    }
                    else
                    {
                        var stack = e.data.stack;
                        if (stack)
                        {
                            stack = stack.replace(new RegExp(webworkerUrl, 'g'), "code");
                            var trim = stack.indexOf("self.onmessage@"); // Firefox
                            var firefox = (trim != -1);
                            if (firefox)
                            {
                                stack = "Error:\n" + stack;
                                trim = stack.indexOf("self.onmessage@");
                            }
                            else
                            {
                                trim = stack.indexOf("at self.onmessage"); // chrome
                            }
                            if (trim != -1)
                            {
                                stack = stack.substr(0, trim);
                            }
                            that.generateText = stack;
                        }
                        else
                        {
                            that.generateText = "Generate function must return a Uint8Array of size 256";
                        }
                    }
                    that.generateButton = "Generate";
                    webworker.terminate();
                    webworker = null;
                };
                webworker.postMessage('Test');
            }
        }
    });

    Vue.use(VueCodemirror);

    Vue.component('tabs', {
        template: "#tabs",
        data: function () {
            return {
                currentTab: 'Edit',
                tabs: ['Edit', 'JavaScript']
            }
        },
        computed: {
            currentTabComponent: function () {
                return 'tab-' + this.currentTab.toLowerCase()
            }
        }
    });

    Vue.component('modal', {
        template: '#modal-template'
    })

    var self = this;
    this.vueapp = new Vue({
        el: '#vueapp',
        data: {
            activeModal: this.activeModal,
            filename: this.filename,
            files: this.files
        },
        computed: {
            canDelete: function ()
            {
                return self.getFilename() !== self.app.filename;
            }
        },
        methods: {
            load: function ()
            {
                self.app.loadBreadboard(self.getFilename());
            },
            saveAs: function ()
            {
                self.app.filename = self.getFilename();
                this.files.push(this.filename.value);
            },
            deleteFile: function ()
            {
                window.localStorage.removeItem(self.getFilename());
                var deleteIndex = this.files.indexOf(this.filename.value);
                if (deleteIndex === -1)
                {
                    this.files.splice(deleteIndex, 1);
                }
            },
            close: function()
            {
                self.closeModal();
            }
        }
    });
};

VueApp.prototype.getFilename = function getFilename()
{
    var f = this.filename.value;
    return f === "breadboard" ? "breadboard" : "breadboard_" + f;
};

VueApp.prototype.closeModal = function closeModal()
{
    if (this.activeModal.value == "EEPROM")
    {
        var breadboard = this.breadboard;
        var component = breadboard.getSelectedComponent();

        var outputs = this.outputs;
        var i;
        for (i = 0; i < 256; i += 1)
        {
            component.valueLookup[i] = outputs[i];
        }
        this.breadboard = null;
    }
    this.activeModal.value = "";
};

VueApp.prototype.showConfigureModal = function showConfigureModal(breadboard)
{
    this.breadboard = breadboard;
    var component = breadboard.getSelectedComponent();
    var i;
    for (i = 0; i < 256; i += 1)
    {
        Vue.set(this.outputs, i, component.valueLookup[i]);
    }

    this.activeModal.value = "EEPROM";
};

VueApp.prototype.showModal = function showModal(type)
{
    var i;
    this.activeModal.value = type;
    if (type === "load" || type === "saveAs")
    {
        this.files.length = 0;
        var storage = window.localStorage;
        var l = storage.length;
        for (i = 0; i < l; i += 1)
        {
            var key = storage.key(i);
            if (key.startsWith("breadboard"))
            {
                var filename = key.substr(("breadboard_").length);
                filename = filename ? filename : "breadboard";
                this.files.push(filename);
                if (key === this.app.filename)
                {
                    this.filename.value = filename;
                }
            }
        }
    }
};

