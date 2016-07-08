var videoService = function () {

    var data = [
        {
            id : '1',
            poster : 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/197359/caminandes-1.jpg',
            src : 'https://dl.dropboxusercontent.com/u/57653109/html5video/video1.mp4',
            type : 'video/mp4',
            title : 'Caminandes 1'
        },
        {
            id : '2',
            poster : 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/197359/big-buck-bunny.jpg',
            src : 'https://dl.dropboxusercontent.com/u/57653109/html5video/video3.mp4',
            type : 'video/mp4',
            title : 'Big buck bunny'
        },
        {
            id : '3',
            poster : 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/197359/caminandes-2.jpg',
            src : 'https://dl.dropboxusercontent.com/u/57653109/html5video/video2.mp4',
            type : 'video/mp4',
            title : 'Caminandes 2'
        },
        {
            id : '4',
            poster : 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/197359/sintel.jpg',
            src : 'https://dl.dropboxusercontent.com/u/57653109/html5video/video4.mp4',
            type : 'video/mp4',
            title : 'Sintel'
        }
    ]

    function getAll () {
        return data;
    }

    function getOne (id) {
        for( var i = 0 ; i < data.length ; i++ ){
            var current = data[i];
            if(current && current.id == id){
                return current;
            }
        }
        return null;
    }

    return {
        getAll: getAll,
        getOne : getOne
    }

}();