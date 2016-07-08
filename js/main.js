
var media_player_instance;

function createLink (id,poster, title){

    var link = document.createElement('a');
    link.setAttribute('href', '#/video/' + id);
    link.classList.add('playlist-video');


    var img = document.createElement('img');
    img.setAttribute('src', poster);

    link.appendChild(img);

    var span = document.createElement('span');
    span.classList.add('playlist-video_title');
    span.innerHTML = title;

    link.appendChild(span);

    return link;
}

function HomeController () {

    var playlist = document.querySelector('.playlist');

    var videoService = spa.services.resolve('videoService');
    var videos = videoService.getAll();
    videos.forEach(function (video,index){
        var link = createLink(video.id,video.poster,video.title);
        playlist.appendChild(link);
    });

}

function VideoController (id) {

    var persistent_player_container = document.querySelector('.persistent-player'),
        videoService = spa.services.resolve('videoService');

    var video = videoService.getOne(id);

    var el = document.querySelector('.mp-player'),
        title = document.querySelector('.page-title');

    // création du media player
    var options = {
        poster : video.poster,
        sources : [
            {
                src : video.src,
                type : video.type
            }
        ]
    };

    if(!media_player_instance){
        player = new mp.HTML5Player(el,options);
        media_player_instance = {
            id : id,
            options : options,
            player : player,
            el : el
        };
        // infos
        title.innerHTML = video.title;
    }
    else {
        // si la video est différente de la video actuelle
        if(media_player_instance.id != id){
            media_player_instance.player.next(options);
            // infos
            title.innerHTML = video.title;
        }
    }
}

function main (){

    var viewContainer = document.querySelector('.page-content'),
        persistent_player_container = document.querySelector('.persistent-player'),
        close_button,
        close_timer,
        isClosing = false,
        received_id;

    spa.init(viewContainer);

    // services
    spa.services.register('videoService', videoService);

    // routes
    spa.router.registerRoute('/','templates/home.html', HomeController);
    spa.router.registerRoute('/video/:id','templates/video.html', VideoController);
    spa.router.registerRoute('/settings','templates/settings.html');

    function onNavigateFrom () {
        if(!isClosing){
            spa.router.navigateToHash('#/video/' + received_id);
        }
    }

    document.addEventListener('routechanging',function (e){
        if(e.navigationEventArgs.route.pattern == '/video/:id'){
            //  creation mini player
            if(!persistent_player_container.classList.contains('mini')){
                persistent_player_container.classList.add('mini');
            }

            received_id = e.navigationEventArgs.parameters[0];
            persistent_player_container.addEventListener('click',onNavigateFrom);  
            media_player_instance.player.switchToMini();

            close_button = persistent_player_container.querySelector('.close-button');
            close_button.addEventListener('click',function(){
                isClosing = true;
                media_player_instance.player.closeMini();
                
                clearTimeout(close_timer);
                setTimeout(function(){
                    isClosing = false;
                },1000);
            }); 
        }
    });

    document.addEventListener('routechanged',function (e){
        if(e.navigationEventArgs.route.pattern == '/video/:id'){
            // player en grand
            if(persistent_player_container.classList.contains('mini')){
                persistent_player_container.classList.remove('mini');
            }
            persistent_player_container.removeEventListener('click',onNavigateFrom);
            media_player_instance.player.switchToNormal();
        }
    });

}

document.addEventListener('DOMContentLoaded', main);