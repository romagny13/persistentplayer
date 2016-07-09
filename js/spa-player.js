(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        // root is window
        root.mp = factory();
    }
}(this, function() {

    var extend = function(source, target) {
        if (typeof source == 'object') {
            for (var property in source) {
                if (!target[property]) {
                    target[property] = source[property];
                }
            }
        }
        return target;
    }

    var SVGButton = function(element, options) {
        if (!element) throw new Error('Element cannot be null');

        var snap = Snap(element),
            path = snap.select('path');

        var defaults = {
            duration: 300,
            easing: mina.easeinout
        }

        extend(defaults, options);

        function toState(number) {
            var state = options.states[number];

            if (!state) throw new Error('State number ' + number + ' not found');

            if (options.noTransition) {
                path.node.setAttribute('d', state);
            } else {
                path.animate({
                    'path': state
                }, options.duration, options.easing);
            }
        }

        return {
            toState: toState
        }
    }

    var scriptLoader = function() {

        function hasScript(src) {
            var result = document.querySelector('script[src="' + src + '"]');
            return result !== null;
        }

        function getFirstScript(selector) {
            var search = selector ? selector + ' script' : 'script';
            var result = document.querySelector(search);
            return result;
        }

        function loadScript(options) {

            if (!options.src) throw new Error('Src cannot be null');

            var src = options.src;

            if (hasScript(src)) {
                options.onComplete();
            }

            // create script
            var script = document.createElement('script');
            script.src = src;
            // load
            script.onload = function() {
                if (options.onComplete) {
                    options.onComplete(src);
                }
            }
            script.onerror = function(e) {
                if (options.onError) {
                    options.onError(e);
                }
            }
            // append script
            var selector = options.inBody ? 'body' : 'head';
            var parent = document.querySelector(selector);
            var firstScript = getFirstScript(selector);
            if (firstScript) {
                parent.insertBefore(script, firstScript);
            } else {
                parent.appendChild(script);
            }
        }

        function loadScripts(options) {

            if (!options.sources) throw new Error('Sources cannot be null');

            var sources = options.sources,
                len = options.sources.length,
                loadCount = 1;

            for (var i = 0; i < len; i++) {
                var source = sources[i];
                if (source) {

                    var opts = {
                        src: source.src,
                        inBody: source.inBody ? source.inBody : false,
                        onComplete: function(response) {
                            if (options.onUpdate) {
                                options.onUpdate(response);
                            }

                            if (loadCount == len) {
                                options.onComplete();
                            }
                            loadCount++;
                        },
                        onError: function(err) {
                            if (options.onError) {
                                options.onError(err);
                            }
                            loadCount++;
                        }
                    }

                    loadScript(opts);
                }
            }
        }

        return {
            hasScript: hasScript,
            loadScript: loadScript,
            loadScripts: loadScripts
        }

    }();

    var mpHelper = function() {

        function formatTime(time) {
            // time = 360.121313 secs
            // 1 heure = 3600 sec
            var hours = Math.floor(time / 3600);
            // 1 min = 60 sec
            var minutes = Math.floor((time - (hours * 3600)) / 60);
            var seconds = Math.floor(time - (hours * 3600) - (minutes * 60));

            var result = '';

            if (hours > 0) {
                result += hours + ':';
                result += minutes < 10 ? '0' + minutes + ':' : minutes + ':';
            } else {
                result += minutes + ':';
            }
            result += seconds < 10 ? '0' + seconds : seconds;
            return result;
        }

        function getWidthForTime(time) {
            // 0:00 < 600s (inferieur à 10min) 40px
            // 10:00 < 3600s (inférieur à 1h) 47px
            // 1:00:00 < 36000s (inférieur à 10h) 57px
            // 10:00:00 ... 65px

            if (time < 600) {
                return 40;
            } else if (time < 3600) {
                return 47;
            } else if (time < 36000) {
                return 57;
            } else {
                return 65;
            }
        }

        return {
            formatTime: formatTime,
            getWidthForTime: getWidthForTime
        }

    }();

    var HTMLCreator = function () {

        function createLoader(parent) {
            var html = '<div class="mp-loading">' 
            +   '<div class="loader">' 
            +       '<div class="circle"></div>' 
            +       '<div class="circle"></div>' 
            +       '<div class="circle"></div>' 
            +    '</div>' 
            +'</div>';

            parent.insertAdjacentHTML('beforeend', html);
        }

        function createVideo(options) {

            var html_element_video = document.createElement('video');
            if (options.poster) {
                html_element_video.setAttribute('poster', options.poster);
            }

            html_element_video.setAttribute('width', options.width);
            html_element_video.setAttribute('height', options.height);
            if (options.autoplay) {
                html_element_video.setAttribute('autoplay', options.autoplay);
            }

            var sources = options.sources;
            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];
                if (source) {
                    var html_element_source = document.createElement('source');
                    html_element_source.setAttribute('src', source.src);
                    html_element_source.setAttribute('type', source.type);

                    html_element_video.appendChild(html_element_source);
                }
            }

            return html_element_video;
        }

        function createBottomBar(width, left, parent) {

            var html = '<div class="mp-bottom-bar" style="width: ' + width + 'px; left: ' + left + 'px;">' +
                '<div class="mp-progress">' +
                '<div class="mp-progress-times">' +
                '<span class="mp-time-current"></span>' +
                '<span class="mp-time-duration"></span>' +
                '</div>' +
                '<div class="mp-progress-bar-all">' +
                '<div class="mp-progress-bar">' +
                '<div class="mp-load-progress"></div>' +
                '<div class="mp-play-progress peter-blue-background-color"></div>' +
                '</div>' +
                '<span class="mp-tooltip"></span>' +
                '<div class="mp-handle-button peter-blue-background-color"></div>' +
                '</div>' +
                '</div>' +
                '<div class="mp-controls">' +
                '<div class="mp-controls-left">' +
                '<button class="mp-play-button mp-button" title="Pause">' +
                '<svg xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  width="100%" height="100%" viewBox="0 0 36 36">' +
                '<path class="svg-fill" d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z"></path>' +
                '</svg>' +
                '</button>' +
                '<button class="mp-mute-button mp-button" title="Toggle mute">' +
                '<svg xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" version="1.1" viewBox="0 0 36 36" >' +
                '<path class="svg-fill" d="m 9,15.37 0,5.25 3.58,0 4.48,4.37 0,-14 -4.48,4.37 -3.58,0 0,0 z M21,18 C21,16.43 20.01,15.08 18.78,14.42 l0,7.16 C20.1,20.92 21,19.57 21,18 z M 18.78,10.2 18.78,12.04 C21.35,12.8 23.22,15.18 23.22,18 23.22,20.82 21.35,23.2 18.78,23.96 L18.78,25.8 C22.34,24.99 25,21.8 25,18 25,14.2 22.34,11.01 18.78,10.2 z"></path>' +
                '</svg>' +
                '</button>' +
                '<div class="mp-volume-panel">' +
                '<div class="mp-volume-slider">' +
                '<div class="mp-volume-slider-handle"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="mp-controls-right">' +
                '<button class="mp-fullscreen-button mp-button" title="Toggle fullscreen">' +
                '<svg xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  width="100%" height="100%" viewBox="0 0 36 36">' +
                '<path d="m 10,15.71 2.28,0 0,-3.42 3.42,0 0,-2.28 L 10,10 l 0,5.71 0,0 z" fill="#fff"></path>' +
                '<path d="m 20.28,10 0,2.28 3.42,0 0,3.42 2.28,0 L 26,10 l -5.71,0 0,0 z" fill="#fff"></path>' +
                '<path d="m 23.71,23.71 -3.42,0 0,2.28 L 26,26 l 0,-5.71 -2.28,0 0,3.42 0,0 z" fill="#fff"></path>' +
                '<path d="M 12.28,20.28 10,20.28 10,26 l 5.71,0 0,-2.28 -3.42,0 0,-3.42 0,0 z" fill="#fff"></path>' +
                '</svg>' +
                '</button>' +
                '</div>' +
                '</div>' +
                '</div>';

            parent.insertAdjacentHTML('beforeend', html);
        }

        function createMini (parent){

            var html = '<div class="mini-overlay">'
            +   '<div class="icon">'
            +     '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">'
            +        '<path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6z"></path>'
            +     '</svg>'
            +   '</div>'
            +   '<div class="close-button">'
            +    '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">'
            +             '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>'
            +    '</svg>'
            +   '</div>'
            +'</div>';

            parent.insertAdjacentHTML('beforeend', html);
        }

        function updateVideo(video,options) {

            video.innerHTML = '';

            if (options.poster) {
                video.setAttribute('poster', options.poster);
            }

            video.setAttribute('src',options.sources[0].src); // ?
            video.setAttribute('width', options.width);
            video.setAttribute('height', options.height);
            if (options.autoplay) {
                video.setAttribute('autoplay', options.autoplay);
            }

            var sources = options.sources;
            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];
                if (source) {
                    var html_element_source = document.createElement('source');
                    html_element_source.setAttribute('src', source.src);
                    html_element_source.setAttribute('type', source.type);

                    video.appendChild(html_element_source);
                }
            }
        }


        return {
            createBottomBar : createBottomBar,
            createLoader : createLoader,
            createMini : createMini,
            createVideo : createVideo,
            updateVideo : updateVideo
        }

    }();

    var HTML5Player = function(el, options) {

        var mp_player,
            loader,
            video,
            video_duration,
            media_player_width,
            bottom_bar_width,
            bottom_bar,
            play_progress,
            progress_bar_offset_left,
            load_progress,
            time_current,
            time_duration,
            progress_handle_button,
            progress_handle_button_width,
            progress_bar,
            media_tooltip,
            play_pause_button,
            mute_button,
            volume_slider,
            volume_slider_offset_left,
            volume_slider_handle,
            full_screen_button,
            mini_overlay,
            volume_panel,
            mouse_move_timer,
            isClosed,
            isMini = false,
            isOnProgressBar = false,
            progressDrag = false,
            volumeDrag = false,
            isInFullscreen = false;

        var defaults = {
            autoplay : true,
            currentTime : 0,
            volume : .7,
            muted : false,
            hideAlwaysControls : false,
            showAlwaysControls : false,
            width : 853,
            height : 480,
            mini_width : 224,
            mini_height : 126
            //            mini_width : 336,
            //            mini_height : 189
        }

        function showLoader() {
            loader.style.display = 'block';
        }

        function hideLoader() {
            loader.style.display = 'none';
        }

        function onLoadedMetadata() {

            hideLoader();

            video.controls = false;
            mp_player.style.width = options.width + 'px';
            mp_player.style.height = options.height + 'px';

            // duration
            video_duration = video.duration;
            time_duration.innerHTML = mpHelper.formatTime(video_duration);

            // autoplay
            if (options.autoplay) {
                play_pause_button.setAttribute('title', 'Pause');
                play_pause_snap_button.toState(1);
            } 
            else {
                play_pause_button.setAttribute('title', 'Play');
            }

            // currentTime
            video.currentTime = options.currentTime;
            time_current.innerHTML = mpHelper.formatTime(options.startTime);

            // volume
            setVolume(options.volume);

            // muted
            if(options.muted){
                video.muted = true;
                updateVolume_controls(0)      
            }
            // show / hide always controls
            if (!options.hideAlwaysControls) {
                showControls();
            }

            console.log(isClosed);
            if(isClosed){
                mp_player.style.display ='block';
                video.play();
                isClosed = false;
            }

            // events
            if (!options.showAlwaysControls && !options.hideAlwaysControls) {
                mp_player.addEventListener('mousemove', showControls);
                mp_player.addEventListener('mouseleave', hideControls);     
            }
        }

        function onTimeUpdate() {

            if (isInFullscreen) {
                if (video.paused || video.ended) {
                    play_pause_snap_button.toState(0);
                } else {
                    play_pause_snap_button.toState(1);
                }
            }

            if (!progressDrag) {
                // valeur courante / durée pour obtenir le scale x
                var scaleX = video.currentTime / video_duration;
                play_progress.style.transform = 'scaleX(' + scaleX + ')';

                var left = bottom_bar_width * video.currentTime / video_duration;
                progress_handle_button.style.left = left + 'px';

                // times
                time_current.innerHTML = mpHelper.formatTime(video.currentTime);
            }
        }

        function onResize (){
            progress_bar_offset_left = play_progress.getBoundingClientRect().left;
            volume_slider_offset_left = volume_slider.getBoundingClientRect().left;
        }

        function onBuffering() {
            if (video.buffered && video.buffered.length > 0) {
                var bufferedEnd = video.buffered.end(0);
                var scaleX = bufferedEnd / video_duration;
                load_progress.style.transform = 'scaleX(' + scaleX + ')';
            }
        }

        function onVolumeChange(e) {
            var margin_anim = 12,
                position = e.pageX - volume_slider_offset_left - margin_anim,
                volume = position / volume_slider.clientWidth;

            setVolume(volume);
        }

        function onFullscreenVolumeChange(){
            if (isInFullscreen) {
                var volume = video.muted ? 0 : video.volume;
                updateVolume_controls(volume);
            }
        }

        function onHidingMouse() {
            clearTimeout(mouse_move_timer);

            if (!isOnProgressBar) {
                if (mp_player.classList.contains('hide-cursor')) {
                    mp_player.classList.remove('hide-cursor');
                }

                if (!video.paused && !video.ended) {
                    mouse_move_timer = setTimeout(function() {
                        mp_player.classList.add('hide-cursor');
                        hideControls();
                    }, 3000);
                }
            }
        }

        function onMousedownOnProgressBarHandleButton(e) {
            progressDrag = true;
        }

        function onMouseup(e) {
            if (progressDrag) {
                onProgress(e);
                progressDrag = false;
            }
            if (volumeDrag) {
                onVolumeChange(e);
                volumeDrag = false;
            }
        }

        function onMousemove(e) {
            if (progressDrag) {
                onProgress(e);
            }
            if (volumeDrag) {
                onVolumeChange(e);
            }
        }

        function onEnded() {
            play_pause_snap_button.toState(0);
            showControls();
        }

        function onProgress(e) {
            var position = e.pageX - progress_bar_offset_left,
                percentage = 100 * position / progress_bar.clientWidth;

            if (percentage > 100) {
                percentage = 100;
            }
            if (percentage < 0) {
                percentage = 0;
            }

            var currentTimeToGo = video_duration * percentage / 100,
                scaleX = currentTimeToGo / video_duration;
            play_progress.style.transform = 'scaleX(' + scaleX + ')';

            var left = bottom_bar_width * percentage / 100;
            progress_handle_button.style.left = left + 'px';

            video.currentTime = video_duration * percentage / 100;
            time_current.innerHTML = mpHelper.formatTime(video.currentTime);
        }

        function onMousemoveOnProgressBar(e) {
            var position = e.pageX - progress_bar_offset_left,
                percentage = 100 * position / progress_bar.clientWidth;

            if (percentage > 100) {
                percentage = 100;
            }
            if (percentage < 0) {
                percentage = 0;
            }

            var timeToGo = video_duration * percentage / 100;
            media_tooltip.innerHTML = mpHelper.formatTime(timeToGo);

            var width = mpHelper.getWidthForTime(timeToGo);
            var left = bottom_bar_width * percentage / 100 - width / 2;
            media_tooltip.style.left = left + 'px';

            if (!media_tooltip.classList.contains('show')) {
                media_tooltip.classList.add('show');
            }
        }

        function onMouseleaveOnProgressBar() {
            isOnProgressBar = false;
            media_tooltip.classList.remove('show');
        }

        function openVolumePanel() {
            volume_panel.classList.add('open');
        }

        function closeVolumePanel () {
            isOnProgressBar = false;
            volume_panel.classList.remove('open');
        }

        function enterFullscreen() {
            if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
            } else if (video.mozEnterFullscreen) {
                video.mozEnterFullscreen();
            } else {
                // no support
            }
        }

        function init (el,options){   
            if (!el) throw new Error('El cannot be null');

            mp_player = el;
            extend(defaults,options);

            scriptLoader.loadScripts({
                sources: [{
                    src: 'https://cdn.jsdelivr.net/snap.svg/0.4.1/snap.svg-min.js',
                    inBody: true
                }],
                onComplete: onContinueInit
            });
        }

        function onContinueInit() {
            /*****************************************
                    Création des éléments html 
            ******************************************/
            mp_player.innerHTML = '';

            // vidéo
            video = HTMLCreator.createVideo(options,mp_player);
            mp_player.appendChild(video);

            // bottom bar
            var margin = 24;
            media_player_width = options.width;
            bottom_bar_width = media_player_width - 2 * margin;
            HTMLCreator.createBottomBar(bottom_bar_width,margin,mp_player);

            // loader
            HTMLCreator.createLoader(mp_player);

            // affichage du loader
            loader = mp_player.querySelector('.mp-loading');
            showLoader();

            /*****************************************
                        SVG Buttons 
            ******************************************/
            play_pause_snap_button = new SVGButton('.mp-play-button svg', {
                states: [
                    'M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z',
                    'M 12,26 16.33,26 16.33,10 12,10 z M 20.66,26 25,26 25,10 20.66,10 z'
                ],
                duration: 200
            });

            mute_snap_button = new SVGButton('.mp-mute-button svg', {
                states: [
                    'm 9,15.37 0,5.25 3.58,0 4.48,4.37 0,-14 -4.48,4.37 -3.58,0 0,0 z M21,18 C21,16.43 20.01,15.08 18.78,14.42 l0,7.16 C20.1,20.92 21,19.57 21,18 z M 18.78,10.2 18.78,12.04 C21.35,12.8 23.22,15.18 23.22,18 23.22,20.82 21.35,23.2 18.78,23.96 L18.78,25.8 C22.34,24.99 25,21.8 25,18 25,14.2 22.34,11.01 18.78,10.2 z',
                    'm 9,15.37 0,5.25 3.58,0 4.48,4.37 0,-14 -4.48,4.37 -3.58,0 0,0 z M21,18 C21,16.43 20.01,15.08 18.78,14.42 l0,7.16 C20.1,20.92 21,19.57 21,18 z',
                    'M 17.060547 10.990234 L 12.580078 15.359375 L 9 15.359375 L 9 15.369141 L 9 20.619141 L 12.580078 20.619141 L 17.060547 24.990234 L 17.060547 10.990234 z M 20.199219 14.5 L 18.939453 15.730469 L 21.259766 18 L 18.939453 20.259766 L 20.199219 21.5 L 22.519531 19.230469 L 24.849609 21.5 L 26.109375 20.259766 L 23.789062 18 L 26.109375 15.740234 L 26.109375 15.730469 L 24.849609 14.5 L 22.519531 16.759766 L 20.199219 14.5 z '
                ],
                noTransition: true
            });

            /*****************************************
                        GET éléments html 
            ******************************************/
            bottom_bar = el.querySelector('.mp-bottom-bar');
            play_progress = el.querySelector('.mp-play-progress');
            progress_bar_offset_left = play_progress.getBoundingClientRect().left;
            load_progress = el.querySelector('.mp-load-progress');
            time_current = el.querySelector('.mp-time-current');
            time_duration = el.querySelector('.mp-time-duration');
            progress_handle_button = el.querySelector('.mp-handle-button');
            progress_handle_button_width = progress_handle_button.clientWidth;
            progress_bar = el.querySelector('.mp-progress-bar');
            media_tooltip = el.querySelector('.mp-tooltip');
            play_pause_button = el.querySelector('.mp-play-button');
            mute_button = el.querySelector('.mp-mute-button');
            volume_slider = el.querySelector('.mp-volume-slider');
            volume_slider_offset_left = volume_slider.getBoundingClientRect().left;
            volume_slider_handle = el.querySelector('.mp-volume-slider-handle');
            full_screen_button = el.querySelector('.mp-fullscreen-button');
            volume_panel = el.querySelector('.mp-volume-panel');

            /*****************************************
                        inline styles
            ******************************************/
            play_progress.style.transform = 'scaleX(0)'; 
            load_progress.style.transform = 'scaleX(0)'; 

            /*****************************************
                        Events
            ******************************************/
            video.addEventListener('waiting', showLoader);
            video.addEventListener('canplay', hideLoader);
            video.addEventListener('seeked', hideLoader);
            // resize
            video.onresize = onResize;
            window.onresize = onResize;
            // progress
            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('progress', onBuffering);
            // video ended
            video.addEventListener('ended', onEnded);
            // load metadata
            video.addEventListener('loadedmetadata', onLoadedMetadata);

            // user Play / Pause
            video.addEventListener('click', togglePlayPause);
            play_pause_button.addEventListener('mouseup', togglePlayPause);

            progress_bar.addEventListener('mouseenter', function() {
                isOnProgressBar = true;
            })

            // cacher les controls si la souris ne bouge pas
            mp_player.addEventListener('mousemove', onHidingMouse);
            // user change progress 
            progress_bar.addEventListener('mousemove', onMousemoveOnProgressBar);
            progress_bar.addEventListener('mouseleave', onMouseleaveOnProgressBar);
            progress_bar.addEventListener('click', onProgress);
            progress_handle_button.addEventListener('mousedown', onMousedownOnProgressBarHandleButton);
            document.addEventListener('mouseup', onMouseup);
            document.addEventListener('mousemove', onMousemove);

            // Mute
            mute_button.addEventListener('click', toggleMute);
            mute_button.addEventListener('mouseenter', openVolumePanel);
            bottom_bar.addEventListener('mouseleave', closeVolumePanel);
            // Volume change
            volume_slider.addEventListener('mousedown', function(e) {
                volumeDrag = true;
            });

            // Full screen
            full_screen_button.addEventListener('click', enterFullscreen);
            video.addEventListener("mozfullscreenchange", function() {
                isInFullscreen = document.mozFullScreen;
            }, false);
            video.addEventListener("webkitfullscreenchange", function() {
                isInFullscreen = document.webkitIsFullScreen;
            }, false);
            // gestion du son en fullscreen
            video.addEventListener('volumechange', onFullscreenVolumeChange);
        }

        init(el,options);

        /*****************************************
                            Api
            -	Play
            -	Pause
            -	Stop
            -	Change current time
            -	Change video source
            -	Hide / show controls + force
            -	Mute
            -	Change volume
            -	Go / exit fullscreen ?
            -	Change size
            -	Change etat > mini ou grand
         ******************************************/

        function play() {
            video.play();
            play_pause_button.setAttribute('title', 'Pause');
            play_pause_snap_button.toState(1);

            var is_hover_bottom_bar = el.querySelector('.mp-bottom-bar:hover');
            if (!is_hover_bottom_bar) {
                setTimeout(hideControls, 2000);
            }
        }

        function pause() {
            video.pause();
            showControls();
            play_pause_button.setAttribute('title', 'Play');
            play_pause_snap_button.toState(0);
        }

        function stop() {
            video.pause();
            video.currentTime = 0;
            showControls();
            play_pause_button.setAttribute('title', 'Play');
            play_pause_snap_button.toState(0);
        }

        function togglePlayPause() {
            if (video.paused || video.ended) {
                play();
            } else {
                pause();
            }
        }

        function seekTo(time){
            if (time > video_duration) {
                time = video_duration;
            }
            video.currentTime = time;
        }

        function toggleMute() {
            if (video.muted) {
                video.muted = false;
                updateVolume_controls(video.volume);
            } else {
                video.muted = true;
                updateVolume_controls(0);
            }
        }

        function setVolume(volume) {
            if (volume < .01) {
                volume = 0;
            }
            if (volume > 1) {
                volume = 1;
            }

            if (video.muted) {
                video.muted = false;
            }
            video.volume = volume;
            updateVolume_controls(volume);
        }

        function updateVolume_controls(volume) {

            if (volume == 0) {
                mute_snap_button.toState(2);
            } else if (volume < .5) {
                mute_snap_button.toState(1);
            } else {
                mute_snap_button.toState(0);
            }

            var left = 52 * volume;
            volume_slider_handle.style.left = left + 'px';
        }

        function showControls(force) {

            if(options.hideAlwaysControls && !force) return false;

            if (!bottom_bar.classList.contains('show')) {
                bottom_bar.classList.add('show');
            }
        }

        function hideControls(force) {
            if ((options.showAlwaysControls || video.paused || video.ended) && !force) return false;

            bottom_bar.classList.remove('show');
        }

        function setSize (width,height){
            mp_player.style.width = width + 'px';
            mp_player.style.height = height + 'px';
            if(video){
                video.width = width;
                video.height = height;
            }
        }

        function next(opts) {

            showLoader();   

            var old = {
                autoplay : true,
                currentTime : 0,
                volume : video.volume,
                muted : video.muted,
                hideAlwaysControls : false,
                showAlwaysControls : false,
                width : 853,
                height : 480,
                mini_width : 224,
                mini_height : 126
            }
            options = extend(old, opts);

            try {
                if(isClosed){
                    mp_player.style.display ='block';
                }
                HTMLCreator.updateVideo(video,opts);
            }
            catch (e) {
                throw new Error(e.message);
            }
        }

        function switchToMini(width, height){    
            if(!width) width = options.mini_width;
            if(!height) height = options.mini_height;

            HTMLCreator.createMini(mp_player);
            mini_overlay = mp_player.querySelector('.mini-overlay');
            // width height
            setSize(width,height);
            mp_player.classList.add('mini');
        }

        function switchToNormal(){
            if(mini_overlay){
                mp_player.removeChild(mini_overlay);
            }
            setSize(options.width,options.height);
            mp_player.classList.remove('mini');
        }

        function toggleMini(){
            if(isMini){
                switchToNormal();
                isMini = false;
            }
            else{
                switchToMini();
                isMini = true;
            }
        }

        function getCurrentTime () {
            return video.currentTime;
        }

        function getDuration () {
            return video.duration;
        }

        function getVolume () {
            return video.volume;
        }

        function isMuted () {
            return video.muted;
        }

        function closeMini(){
            mp_player.style.display ='none';
            stop();
            isClosed = true;
        }

        return {
            closeMini : closeMini,
            getCurrentTime : getCurrentTime,
            getDuration : getDuration,
            getVolume : getVolume,
            hideControls : hideControls,
            isMuted : isMuted,
            next : next,
            pause : pause,
            play : play,
            seekTo : seekTo,
            setSize : setSize,
            setVolume : setVolume,
            showControls: showControls,
            stop : stop,
            switchToMini : switchToMini,
            switchToNormal : switchToNormal,
            toggleMini : toggleMini,
            toggleMute : toggleMute,
            togglePlayPause : togglePlayPause
        }
    }

    var YtbPlayer = function(el, options) {

        var mp_player,
            loader,
            player,
            video_duration,
            media_player_iframe,
            media_player_width,
            bottom_bar,
            bottom_bar_width,
            media_tooltip,
            play_pause_button,
            play_pause_snap_button,
            progress_handle_button,
            progress_bar,
            play_progress,
            load_progress,
            time_current,
            time_duration,
            mute_button,
            full_screen_button,
            progress_timer,
            mouse_move_timer,
            volume_slider,
            volume_slider_offset_left,
            volume_slider_handle,
            full_screen_button,
            mini_overlay,
            volume_panel,
            mouse_move_timer,
            isClosed,
            isMini = false,
            isOnProgressBar = false,
            progressDrag = false,
            volumeDrag = false,
            isInFullscreen = false;

        var defaults = {
            autoplay : true,
            currentTime : 0,
            volume : .7,
            muted : false,
            hideAlwaysControls : false,
            showAlwaysControls : false,
            width : 853,
            height : 480,
            mini_width : 224,
            mini_height : 126
        }

        //        function showLoader() {
        //            loader.style.display = 'block';
        //        }
        //
        //        function hideLoader() {
        //            loader.style.display = 'none';
        //        }

        function launch_progress_timer () {
            clearInterval(progress_timer);
            progress_timer = setInterval(onTimeUpdate, 500);
        }

        function stop_progress_timer (){
            clearInterval(progress_timer);
        }

        function onTimeUpdate() {

            if (isInFullscreen) {
                var play_state = player.getPlayerState();
                if (play_state == 0 || play_state == 2) {
                    play_pause_snap_button.toState(0);
                } else {
                    play_pause_snap_button.toState(1);
                }
            }

            if (!progressDrag) {
                // valeur courante / durée pour obtenir le scale x
                var currentTime = player.getCurrentTime();
                var scaleX = currentTime / video_duration;
                play_progress.style.transform = 'scaleX(' + scaleX + ')';

                var left = bottom_bar_width * currentTime / video_duration;
                progress_handle_button.style.left = left + 'px';

                // times
                time_current.innerHTML = mpHelper.formatTime(currentTime);
            }

        }

        function onResize (){
            progress_bar_offset_left = play_progress.getBoundingClientRect().left;
            volume_slider_offset_left = volume_slider.getBoundingClientRect().left;
        }

        function onBuffering() {
            if(player){
                var bytes = player.getVideoBytesLoaded();
                var total = player.getVideoBytesTotal();

                var scaleX = bytes / total;
                load_progress.style.transform = 'scaleX(' + scaleX + ')';

                if (bytes < total) {
                    setTimeout(onBuffering, 500);
                }
            }
        }

        function onHidingMouse() {
            clearTimeout(mouse_move_timer);

            if (!isOnProgressBar) {
                if (mp_player.classList.contains('hide-cursor')) {
                    mp_player.classList.remove('hide-cursor');
                }

                var play_state = player.getPlayerState();
                if (play_state != 0 && play_state != 2 ) {
                    mouse_move_timer = setTimeout(function() {
                        mp_player.classList.add('hide-cursor');
                        hideControls();
                    }, 3000);
                }
            }
        }

        function onMousedownOnProgressBarHandleButton(e) {
            progressDrag = true;
        }

        function onMouseup(e) {
            if (progressDrag) {
                onProgress(e);
                progressDrag = false;
            }
            if (volumeDrag) {
                onVolumeChange(e);
                volumeDrag = false;
            }
        }

        function onMousemove(e) {
            if (progressDrag) {
                onProgress(e);
            }
            if (volumeDrag) {
                onVolumeChange(e);
            }
        }

        function onProgress(e) {
            var position = e.pageX - progress_bar_offset_left,
                percentage = 100 * position / play_progress.clientWidth;

            if (percentage > 100) {
                percentage = 100;
            }
            if (percentage < 0) {
                percentage = 0;
            }

            var currentTimeToGo = video_duration * percentage / 100;
            var scaleX = currentTimeToGo / video_duration;
            play_progress.style.transform = 'scaleX(' + scaleX + ')';

            var left = bottom_bar_width * percentage / 100;
            progress_handle_button.style.left = left + 'px';

            var newTime = video_duration * percentage / 100;
            player.seekTo(newTime);
            time_current.innerHTML = mpHelper.formatTime(player.getCurrentTime());
        }

        function onMousemoveOnProgressBar(e) {
            var position = e.pageX - progress_bar_offset_left,
                percentage = 100 * position / progress_bar.clientWidth;

            if (percentage > 100) {
                percentage = 100;
            }
            if (percentage < 0) {
                percentage = 0;
            }

            var timeToGo = video_duration * percentage / 100;
            media_tooltip.innerHTML = mpHelper.formatTime(timeToGo);

            var width = mpHelper.getWidthForTime(timeToGo);
            var left = bottom_bar_width * percentage / 100 - width / 2;
            media_tooltip.style.left = left + 'px';

            if (!media_tooltip.classList.contains('show')) {
                media_tooltip.classList.add('show');
            }
        }

        function onMouseleaveOnProgressBar() {
            isOnProgressBar = false;
            media_tooltip.classList.remove('show');
        }

        function openVolumePanel() {
            volume_panel.classList.add('open');
        }

        function closeVolumePanel () {
            isOnProgressBar = false;
            volume_panel.classList.remove('open');
        }

        function onFullscreenChange(e) {
            var fullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
            if (fullscreen !== undefined) {
                isInFullscreen = fullscreen;
            }
            else{
                isInFullscreen = false;
            }
        }

        function onLoadPlayer() {
            var videoId = options.videoId;
            console.log(videoId);

            var container = document.createElement('div');
            mp_player.appendChild(container);

            player = new YT.Player(container, {
                width: options.width,
                height: options.height,
                videoId: videoId,
                playerVars: {
                    autoplay: options.autoplay ? 1 : 0,
                    controls: 0,
                    // playlist: videoId,
                    showinfo: 0           
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }

        function onPlayerReady(e) {
            //            hideLoader();

            media_player_iframe = el.querySelector('iframe');

            mp_player.style.width = options.width + 'px';
            mp_player.style.height = options.height + 'px';

            // currentTime
            if(options.currentTime > 0){
                player.seekTo(options.currentTime);
            }
            time_current.innerHTML = '0:00';

            // duration
            video_duration = player.getDuration();
            time_duration.innerHTML = mpHelper.formatTime(video_duration);

            // autoplay
            if (options.autoplay) {
                play_pause_button.setAttribute('title', 'Pause');
                play_pause_snap_button.toState(1);
            } 
            else {
                play_pause_button.setAttribute('title', 'Play');
            }

            // volume
            setVolume(options.volume);

            // muted
            if(options.muted){
                player.mute();
                updateVolume_controls(0)      
            }

            if(isClosed){
                mp_player.style.display ='block';
                //                player.play();
                isClosed = false;
            }

            // events
            if (!options.showAlwaysControls && !options.hideAlwaysControls) {
                mp_player.addEventListener('mousemove', showControls);
                mp_player.addEventListener('mouseleave', hideControls);     
            }

            // full screen
            full_screen_button.addEventListener('click', function() {

                var requestFullScreen = media_player_iframe.requestFullScreen || media_player_iframe.mozRequestFullScreen || media_player_iframe.webkitRequestFullScreen;
                if (requestFullScreen) {
                    requestFullScreen.bind(media_player_iframe)();
                }

            });
            media_player_iframe.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
            media_player_iframe.addEventListener('mozfullscreenchange', onFullscreenChange, false);
            media_player_iframe.addEventListener('fullscreenchange', onFullscreenChange, false);
            media_player_iframe.addEventListener('MSFullscreenChange', onFullscreenChange, false);

            launch_progress_timer();
            setTimeout(onBuffering, 500);

            // show / hide always controls
            if (!options.hideAlwaysControls) {
                showControls();
            }
        }

        function onPlayerStateChange(e) {
            //YT.PlayerState.ENDED
            //YT.PlayerState.PLAYING
            //YT.PlayerState.PAUSED
            //YT.PlayerState.BUFFERING
            //YT.PlayerState.CUED

            if (e.data == YT.PlayerState.PLAYING) {
                play_pause_snap_button.toState(1);
            }
            if (e.data == YT.PlayerState.PAUSED) {
                play_pause_snap_button.toState(0);
            }
            if (e.data == YT.PlayerState.ENDED) {
                play_pause_snap_button.toState(0);
                stop_progress_timer();
                showControls();
            }
        }

        function init (el,options){   
            if (!el) throw new Error('El cannot be null');

            mp_player = el;
            extend(defaults,options);

            scriptLoader.loadScripts({
                sources: [{
                    src: 'https://www.youtube.com/iframe_api',
                    inBody: true
                }, {
                    src: 'https://cdn.jsdelivr.net/snap.svg/0.4.1/snap.svg-min.js',
                    inBody: true
                }],
                onComplete: onContinueInit
            });
        }

        function onContinueInit (){
            /*****************************************
                    Création des éléments html 
            ******************************************/
            mp_player.innerHTML = '';

            if (typeof(YT) == 'undefined' || typeof(YT.Player) == 'undefined') {
                window.onYouTubeIframeAPIReady = onLoadPlayer();
            } else {
                onLoadPlayer();
            }
            // bottom bar
            var margin = 24;
            media_player_width = options.width;
            bottom_bar_width = media_player_width - 2 * margin;
            HTMLCreator.createBottomBar(bottom_bar_width,margin,mp_player);

            //            // loader
            //            HTMLCreator.createLoader(mp_player);
            //
            //            // affichage du loader
            //            loader = mp_player.querySelector('.mp-loading');
            //            showLoader();

            /*****************************************
                        SVG Buttons 
            ******************************************/
            play_pause_snap_button = new SVGButton('.mp-play-button svg', {
                states: [
                    'M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z',
                    'M 12,26 16.33,26 16.33,10 12,10 z M 20.66,26 25,26 25,10 20.66,10 z'
                ],
                duration: 200
            });

            mute_snap_button = new SVGButton('.mp-mute-button svg', {
                states: [
                    'm 9,15.37 0,5.25 3.58,0 4.48,4.37 0,-14 -4.48,4.37 -3.58,0 0,0 z M21,18 C21,16.43 20.01,15.08 18.78,14.42 l0,7.16 C20.1,20.92 21,19.57 21,18 z M 18.78,10.2 18.78,12.04 C21.35,12.8 23.22,15.18 23.22,18 23.22,20.82 21.35,23.2 18.78,23.96 L18.78,25.8 C22.34,24.99 25,21.8 25,18 25,14.2 22.34,11.01 18.78,10.2 z',
                    'm 9,15.37 0,5.25 3.58,0 4.48,4.37 0,-14 -4.48,4.37 -3.58,0 0,0 z M21,18 C21,16.43 20.01,15.08 18.78,14.42 l0,7.16 C20.1,20.92 21,19.57 21,18 z',
                    'M 17.060547 10.990234 L 12.580078 15.359375 L 9 15.359375 L 9 15.369141 L 9 20.619141 L 12.580078 20.619141 L 17.060547 24.990234 L 17.060547 10.990234 z M 20.199219 14.5 L 18.939453 15.730469 L 21.259766 18 L 18.939453 20.259766 L 20.199219 21.5 L 22.519531 19.230469 L 24.849609 21.5 L 26.109375 20.259766 L 23.789062 18 L 26.109375 15.740234 L 26.109375 15.730469 L 24.849609 14.5 L 22.519531 16.759766 L 20.199219 14.5 z '
                ],
                noTransition: true
            });

            /*****************************************
                        GET éléments html 
            ******************************************/
            bottom_bar = el.querySelector('.mp-bottom-bar');
            play_progress = el.querySelector('.mp-play-progress');
            progress_bar_offset_left = play_progress.getBoundingClientRect().left;
            load_progress = el.querySelector('.mp-load-progress');
            time_current = el.querySelector('.mp-time-current');
            time_duration = el.querySelector('.mp-time-duration');
            progress_handle_button = el.querySelector('.mp-handle-button');
            progress_handle_button_width = progress_handle_button.clientWidth;
            progress_bar = el.querySelector('.mp-progress-bar');
            media_tooltip = el.querySelector('.mp-tooltip');
            play_pause_button = el.querySelector('.mp-play-button');
            mute_button = el.querySelector('.mp-mute-button');
            volume_slider = el.querySelector('.mp-volume-slider');
            volume_slider_offset_left = volume_slider.getBoundingClientRect().left;
            volume_slider_handle = el.querySelector('.mp-volume-slider-handle');
            full_screen_button = el.querySelector('.mp-fullscreen-button');
            volume_panel = el.querySelector('.mp-volume-panel');

            /*****************************************
                        inline styles
            ******************************************/
            play_progress.style.transform = 'scaleX(0)'; 
            load_progress.style.transform = 'scaleX(0)'; 

            /*****************************************
                        Events
            ******************************************/
            // resize
            //        video.onresize = onResize;
            window.onresize = onResize;

            // user Play / Pause
            play_pause_button.addEventListener('mouseup', togglePlayPause);
            progress_bar.addEventListener('mouseenter', function() {
                isOnProgressBar = true;
            })

            // cacher les controls si la souris ne bouge pas
            mp_player.addEventListener('mousemove', onHidingMouse);
            // user change progress 
            progress_bar.addEventListener('mousemove', onMousemoveOnProgressBar);
            progress_bar.addEventListener('mouseleave', onMouseleaveOnProgressBar);
            progress_bar.addEventListener('click', onProgress);
            progress_handle_button.addEventListener('mousedown', onMousedownOnProgressBarHandleButton);
            document.addEventListener('mouseup', onMouseup);
            document.addEventListener('mousemove', onMousemove);

            // Mute
            mute_button.addEventListener('click', toggleMute);
            mute_button.addEventListener('mouseenter', openVolumePanel);
            bottom_bar.addEventListener('mouseleave', closeVolumePanel);
            // Volume change
            volume_slider.addEventListener('mousedown', function(e) {
                volumeDrag = true;
            });
        }

        init(el,options);

        /*****************************************
                            Api
            -	Play
            -	Pause
            -	Stop
            -	Change current time
            -	Change video source
            -	Hide / show controls + force
            -	Mute
            -	Change volume
            -	Go / exit fullscreen ?
            -	Change size
            -	Change etat > mini ou grand
         ******************************************/

        function play() {
            player.playVideo();
            launch_progress_timer();
            play_pause_button.setAttribute('title', 'Pause');
            play_pause_snap_button.toState(1);

            var is_hover_bottom_bar = el.querySelector('.mp-bottom-bar:hover');
            if (!is_hover_bottom_bar) {
                setTimeout(hideControls, 2000);
            }
        }

        function pause() {
            player.pauseVideo();
            stop_progress_timer();
            showControls();
            play_pause_button.setAttribute('title', 'Play');
            play_pause_snap_button.toState(0);
        }

        function stop() {
            player.stopVideo();
            stop_progress_timer();
            showControls();
            play_pause_button.setAttribute('title', 'Play');
            play_pause_snap_button.toState(0);
        }

        function togglePlayPause() {
            //-1 : non démarré
            //0 : arrêté
            //1 : en lecture
            //2 : en pause
            //3 : en mémoire tampon
            //5 : en file d'attente

            var play_state = player.getPlayerState();
            if (play_state == -1 || play_state == 0 || play_state == 2 || play_state == 5) {
                play();
            }
            if (play_state == 1) {
                pause();
            }
        }

        function seekTo(time){
            if (time > video_duration) {
                time = video_duration;
            }
            player.seekTo(time);
        }

        function toggleMute() {

            if (player.isMuted()) {
                player.unMute();
                updateVolume_controls(player.getVolume() / 100);
            } else {
                player.mute();
                updateVolume_controls(0);
            }
        }

        function setVolume(volume) {

            if (volume < .01) {
                volume = 0;
            }
            if (volume > 1) {
                volume = 1;
            }

            if (player.isMuted()) {
                player.unMute();
            }

            player.setVolume(volume * 100);
            updateVolume_controls(volume);
        }

        function updateVolume_controls(volume) {

            if (volume == 0) {
                mute_snap_button.toState(2);
            } else if (volume < .5) {
                mute_snap_button.toState(1);
            } else {
                mute_snap_button.toState(0);
            }

            var left = 52 * volume;
            volume_slider_handle.style.left = left + 'px';
        }

        function showControls(force) {

            if(options.hideAlwaysControls && !force) return false;

            if (!bottom_bar.classList.contains('show')) {
                bottom_bar.classList.add('show');
            }
        }

        function hideControls(force) {
            var play_state = player.getPlayerState();
            if ((options.showAlwaysControls || play_state == 0 || play_state == 2) && !force) return false;

            bottom_bar.classList.remove('show');
        }

        function setSize (width,height){
            mp_player.style.width = width + 'px';
            mp_player.style.height = height + 'px';
            if(media_player_iframe){
                media_player_iframe.width = width;
                media_player_iframe.height = height;
            }
        }

        function next(opts) {

            // showLoader();   

            var old = {
                autoplay : true,
                currentTime : 0,
                volume : getVolume(),
                muted : isMuted(),
                hideAlwaysControls : false,
                showAlwaysControls : false,
                width : 853,
                height : 480,
                mini_width : 224,
                mini_height : 126
            }
            options = extend(old, opts);

            try {
                if(isClosed){
                    mp_player.style.display ='block';
                }

                // player.loadVideoById({videoId : opts.videoId});
                stop_progress_timer();
                clearTimeout(onBuffering);
                init(el,opts);
            }
            catch (e) {
                throw new Error(e.message);
            }
        }

        function switchToMini(width, height){    
            if(!width) width = options.mini_width;
            if(!height) height = options.mini_height;

            HTMLCreator.createMini(mp_player);
            mini_overlay = mp_player.querySelector('.mini-overlay');
            // width height
            setSize(width,height);
            mp_player.classList.add('mini');
        }

        function switchToNormal(){
            if(mini_overlay){
                mp_player.removeChild(mini_overlay);
            }
            setSize(options.width,options.height);
            mp_player.classList.remove('mini');
        }

        function toggleMini(){
            if(isMini){
                switchToNormal();
                isMini = false;
            }
            else{
                switchToMini();
                isMini = true;
            }
        }

        function getCurrentTime () {
            return video.currentTime;
        }

        function getDuration () {
            return player.getDuration();
        }

        function getVolume () {
            return player.getVolume() / 100;
        }

        function isMuted () {
            return player.isMuted();
        }

        function closeMini(){
            mp_player.style.display ='none';
            stop();
            isClosed = true;
        }

        return {
            closeMini : closeMini,
            getCurrentTime : getCurrentTime,
            getDuration : getDuration,
            getVolume : getVolume,
            hideControls : hideControls,
            isMuted : isMuted,
            next : next,
            pause : pause,
            play : play,
            seekTo : seekTo,
            setSize : setSize,
            setVolume : setVolume,
            showControls: showControls,
            stop : stop,
            switchToMini : switchToMini,
            switchToNormal : switchToNormal,
            toggleMini : toggleMini,
            toggleMute : toggleMute,
            togglePlayPause : togglePlayPause
        }
    }

    var mp = {
        extend: extend,
        HTML5Player: HTML5Player,
        YtbPlayer : YtbPlayer,
        scriptLoader: scriptLoader,
        SVGButton: SVGButton,
        version: '0.2.0'
    }

    return mp;

}));