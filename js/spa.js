(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        // root is window
        root.spa = factory();
    }
}(this, function () {

    var spaHelper = {
        detectIE : function () {
            var ua = window.navigator.userAgent,
                msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }
            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }
            var edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // Edge (IE 12+)
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }
            // other browser
            return false;
        },
        loadTemplate : function (url,callback){
            var options = {
                url : url,
                async : false,
                callback : callback
            };
            ajax.send(options);
        },
        loadTemplateAsync : function (url,callback){
            var options = {
                url : url,
                callback : callback,
                error : function (e){
                    throw new Error('Cannot load "' + url + '" : ' + this.status);
                }
            };
            ajax.send(options);
        },
        extend : function(source, target) {
            if (typeof source == 'object') {
                for (var property in source) {
                    if (!target[property]) {
                        target[property] = source[property];
                    }
                }
            }
            return target;
        }
    };

    function Col(){
        var cache = [];

        function clear() {
            cache = [];
        }

        function count (){
            return cache.length;
        }

        function has(key){
            for(var i = 0; i < cache.length; i++){
                var item = cache[i];
                if(item.key == key){
                    return true;
                }
            }
            return false;
        }

        function get(key){
            for(var i = 0; i < cache.length; i++){
                var item = cache[i];
                if(item.key == key){
                    return item.value;
                }
            }
            return null;
        }

        function getAll (){
            return cache;
        }

        function set(key,value){

            if(has(key)) throw new Error('Map key "' + key + '" already used');

            var item = {
                key : key,
                value : value
            };
            cache.push(item);
        }

        function remove (key){
            for(var i = 0; i < cache.length; i++){
                var item = cache[i];
                if(item.key == key){
                    cache.splice(i,1);
                }
            }      
        }

        return {
            clear : clear,
            count : count,
            has : has,
            get : get,
            getAll : getAll,
            set : set,
            remove : remove
        }
    }

    function Route(pattern,template,callable){
        var self = this,
            _paramMatches = {};

        this.pattern = pattern;
        this.template = template;
        this.callable = callable;

        function getPatternRegex(){

            // optionnal
            var pattern = self.pattern.replace(/\/:([\w]+)\?/g, function(match,p){
                if(_paramMatches[p]){
                    return '\/?(' + _paramMatches[p] + ')?';
                }
                return '\/?([0-9]+)?';
            })
            .replace(/:([\w]+)/g, function(match,p){
                if(_paramMatches[p]){
                    return '(' + _paramMatches[p] + ')';
                }
                return '([0-9]+)';
            });

            var regex = new RegExp('^#' + pattern + '$', 'i');
            return regex;
        }

        this.isTemplateUrl = function(){
            return this.template.match(/^[\/?a-zA-Z0-9_\-]+.html$/) !== null;
        };

        this.match = function(hash){
            var regex = getPatternRegex();
            return regex.test(hash);
        };

        this.getParameters = function(hash){
            var regex = getPatternRegex();
            var matches = hash.match(regex);
            if(matches){
                matches.shift();
            }
            return matches;
        };

        this.with = function(param,match){
            _paramMatches[param] = match;
            return this;
        };

        this.call = function (parameters){
            if(this.callable){
                this.callable.apply(this,parameters);
            }
        };
    }

    var router = function(){

        var routechanging_event,
            routechanging_event_name = 'routechanging',
            routechanged_event,
            routechanged_event_name = 'routechanged',
            routes = [];

        var currentEntry = {
            route : {},
            hash :'',
            parameters : []
        };

        function init (){
            if(spaHelper.detectIE()){
                routechanging_event = document.createEvent('Event');
                routechanging_event.initEvent(routechanging_event_name, true, true);

                routechanged_event = document.createEvent('Event');
                routechanged_event.initEvent(routechanged_event_name, true, true);
            }
            else{
                routechanging_event = new Event(routechanging_event_name);
                routechanged_event = new Event(routechanged_event_name);
            }
        }

        function has(pattern){
            for(var i = 0; i < routes.length; i++){
                var route = routes[i];
                if(route.pattern == pattern){
                    return true;
                }
            }
            return false;
        }

        function registerRoute(pattern, template, callable){
            if(!pattern) throw new Error('Pattern cannot be null');
            if(!template) throw new Error('Template cannot be null');
            if(has(pattern)) throw new Error('Route "' + pattern + '" already registered');

            var route = new Route(pattern,template,callable);
            routes.push(route);

            return route;
        }

        function getMatchedRoute(hash){
            for(var i = 0; i < routes.length; i++){
                var route = routes[i];
                if(route.match(hash)){
                    return route;
                }
            }
        }

        function navigateToHash(hash){
            window.location.hash = hash;
        }

        function run(hash, viewContainer){
            if(!hash) throw new Error('Hash cannot be null');
            if(!viewContainer) {
                if(!spa.viewContainer){
                    throw new Error('ViewContainer cannot be null');
                }
                else{
                    viewContainer = spa.viewContainer;
                }
            }

            // get matched route
            var route = getMatchedRoute(hash);
            if(route){
                var parameters = route.getParameters(hash);

                // changing
                routechanging_event.navigationEventArgs = currentEntry;
                document.dispatchEvent(routechanging_event);

                currentEntry = {
                    route : route,
                    hash : hash,
                    parameters : parameters
                };

                // update view container, call the callable
                if(route.isTemplateUrl()){
                    spaHelper.loadTemplateAsync(route.template, function(responseText){
                        viewContainer.innerHTML = responseText;
                        route.call(parameters);
                        // changed
                        routechanged_event.navigationEventArgs = currentEntry;
                        document.dispatchEvent(routechanged_event);
                    });
                }
                else{
                    viewContainer.innerHTML = route.template;
                    route.call(parameters);
                    // changed
                    routechanged_event.navigationEventArgs = currentEntry;
                    document.dispatchEvent(routechanged_event);
                }
            }
            else{
                throw new Error('No route found for "' + hash + '"');
            }
        }

        function clear (){
            routes = [];
        }

        init();

        return {
            clear : clear,
            has : has,
            navigateToHash : navigateToHash,
            registerRoute : registerRoute,
            run : run
        };
    }();

    function Region (name,container, callable) {
        this.name = name;
        this.container = container;
        this.callable = callable;

        this.navigate = function (contentHtml, parameter){
            this.container.innerHTML = contentHtml;
            if(this.callable){
                this.callable.call(this,parameter);
            }
        }

        this.html = function (contentHtml){
            this.container.innerHTML = contentHtml;
        }
    }

    var regionManager = function () {

        var regions = new Col();

        function clear (){
            regions.clear();
        }

        function getRegion(name){
            return regions.get(name);
        }

        function has(name){
            return regions.has(name);
        }

        function html (name, contentHtml){
            var region = getRegion(name);
            if(region){
                region.html(contentHtml);
            }
        }

        function navigate(name,contentHtml, parameter){
            var region = getRegion(name);
            if(region){
                region.navigate(contentHtml,parameter);
            }
        }

        function registerRegion(name,container, callable){
            if(!name) throw new Error('Region name cannot be null');
            if(!container) throw new Error('Region container cannot be null');
            if(has(name)) throw new Error('Region "' + name + '" already registered');

            var region = new Region(name,container,callable);
            regions.set(name,region);

            return region;
        }

        function removeRegion (name){
            regions.remove(name);
        }

        return {
            clear : clear,
            getRegion : getRegion,
            has : has,
            html : html,
            navigate : navigate,
            registerRegion : registerRegion,
            removeRegion : removeRegion
        }

    }();

    var messenger = function () {

        var cache = {};

        function clear () {
            cache = {};    
        }

        function subscribe(id, fn){
            if(!id) throw new Error('Messenger id cannot be null');
            if(!fn) throw new Error('Messenger function cannot be null');

            if(!cache[id]){
                cache[id] = {
                    callbacks : [fn]
                };
            }
            else{
                cache[id].callbacks.push(fn);           
            }
        }

        function publish (id){
            var args = Array.prototype.slice.call(arguments, 1);

            if(cache[id]){
                var callbacks = cache[id].callbacks;
                for(var i = 0; i < callbacks.length; i++ ){
                    var callback = callbacks[i];
                    if(callback){
                        callback.apply(this,args);
                    }
                }

            }
        }

        function unsubscribe (id, fn){
            if(cache[id]){
                var index = cache[id].callbacks.indexOf(fn);
                if (index > -1) {
                    cache[id].callbacks = cache[id].callbacks.slice(0, index).concat(cache[id].callbacks.slice(index + 1));
                }
            }
        }

        return {
            clear : clear,
            subscribe : subscribe,
            publish : publish,
            unsubscribe : unsubscribe
        }

    }();

    function Service(name, callable){

        this.name = name;

        if(typeof(callable) === 'object'){
            this.callable = callable;
        }
        else if(typeof(callable) === 'function'){
            var service = new callable();
            this.callable = service;
        }
    }

    var services = function (){

        var services = new Col();

        function clear (){
            services.clear();
        }

        function has(name){
            return services.has(name);
        }

        function register (name,callable){
            if(!name) throw new Error('name cannot be null');
            if(!callable) throw new Error('callable cannot be null');
            if(has(name))  throw new Error('"' + name + '" already used');

            var service = new Service(name, callable);
            services.set(name, service);
        }

        function resolve(name){
            var service = services.get(name);
            if(service){
                return service.callable;      
            }
            return null;
        }

        return{
            clear : clear,
            has : has,
            register : register,
            resolve : resolve
        };

    }();

    var ioc = function (){

        var container = new Col();

        function clear (){
            container.clear();
        }

        function has(key){
            return container.has(key);
        }

        function itemCount(){
            return container.count();
        }
        
        function register(key, value){
            if(!key) throw new Error('key cannot be null');
            if(has(key)) throw new Error('"' + key + '" already used');

            var item = {
                key : key,
                value : value
            };
            container.set(key, item);
        }
        
        function remove (key){
            container.remove(key);
        }

        function resolve(key){
            var item = container.get(key);
            if(item){
                return item.value;      
            }
            return null;
        }

        return {
            clear : clear,
            has : has,
            itemCount : itemCount,
            register : register,
            remove : remove,
            resolve : resolve
        };
    }();

    var ajax = function (){

        var defaults = {
            method : 'GET',
            async : true
        };

        function isSuccessStatusCode(code){
            var test = code.toString();
            var regex = /^(200|201|202|203|204|205|206)$/;
            return regex.test(test);
        }

        function send(options){
            if(!options.url) throw new Error('No url found');
            if(!options.callback) throw new Error('No callback function found');

            spaHelper.extend(defaults,options);

            var req = new XMLHttpRequest();
            if(!req) throw new Error('Http request not supported by the browser');

            req.onreadystatechange = function () {
                if (req.readyState === 4) {

                    if(isSuccessStatusCode(req.status)){
                        var response = this.response || this.responseText || this.responseXML;
                        options.callback(response,req.status);
                    }
                    else {
                        if(options.error){
                            options.error(this);
                        }
                    }
                }
            };

            req.open(options.method, options.url, options.async);
            if(options.contentType){
                req.setRequestHeader('Content-type', options.contentType);
            }
            if(options.headers && options.headers instanceof Object){
                for(var key in options.headers){

                    if(key.toLowerCase() == 'content-type' && options.contentType){
                        continue;
                    }

                    if(options.headers.hasOwnProperty(key)){
                        var value = options.headers[key];
                        req.setRequestHeader(key, value);
                    }
                }
            }
            if(options.responseType){
                req.responseType = options.responseType;
            }
            if(options.data){
                req.send(options.data);
            }
            else{
                req.send();
            }
        }

        return {
            send : send
        }

    }();

    var spa = {
        ajax : ajax,
        init : function (viewContainer, manualRun){
            var self = this;

            if(!viewContainer || (window.jQuery && viewContainer instanceof jQuery && viewContainer.length === 0)){
                throw new Error('ViewContainer cannot be null');
            }

            this.viewContainer = viewContainer;

            function run(){
                var hash = location.hash === '' ? '#/' : location.hash;
                self.router.run(hash,self.viewContainer);
            }

            if(!manualRun){

                if (typeof define === 'function' && define.amd) {
                    setTimeout(function(){
                        run();
                    },50);
                }
                else{
                    window.addEventListener('load', function(e){
                        run();
                    });
                }

                window.addEventListener("hashchange", function(e){
                    run();
                });
            }
        },
        ioc : ioc,
        messenger : messenger,
        regionManager : regionManager,
        router: router,
        services : services,
        viewContainer : null,
        version:'0.1.3'
    };

    return spa;
}));
