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

        extend(defaults,options);

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

var apiKey = 'AIzaSyAQl6Zu4Q-WwieawCfIspKb4waz3Yb9K4Q';
var regionCode = 'FR';

var youtubeDataApi = function () {

    function get(url,callback){
        var options = {
            url : url,
            callback: function (response, status){
                callback(response);
            },
            error : function (e){
                console.log(e.status + ' : ' + e.message);
                return false;
            }
        };
        ajax.send(options);
    }

    function getMostPopularVideos(categoryId, all, maxResults, callback, pageToken){
        var url = "https://www.googleapis.com/youtube/v3/videos?";
        url += all ? "part=snippet,contentDetails,statistics" : "part=snippet,contentDetails";
        url+= "&chart=mostPopular"
            + "&maxResults=" + maxResults
            + "&regionCode=" + regionCode;
        if (categoryId){
            url += "&videoCategoryId=" + categoryId;
        }
        if (pageToken){
            url += "&pageToken=" + pageToken;
        }
        url += "&key=" + apiKey;

        console.log(url);

        return get(url,callback);
    }

    function getCategories (callback){
        // https://www.googleapis.com/youtube/v3/videoCategories

        var url = "https://www.googleapis.com/youtube/v3/videoCategories?"
        + "part=snippet"
        + "&regionCode=" + regionCode
        + "&key=" + apiKey;   

        get(url,callback);
    }

    function getVideo(videoId, all,callback){
        var url = "https://www.googleapis.com/youtube/v3/videos?";
        url += all ? "part=snippet,contentDetails,statistics" : "part=snippet,contentDetails";
        url+= "&id=" + videoId
            + "&maxResults=1"
            + "&key=" + apiKey;

        get(url,callback);
    }
    //
    //    function cetCategory(categoryId){
    //        var url = "https://www.googleapis.com/youtube/v3/videoCategories?"
    //        + "part=snippet"
    //        + "&id=" + categoryId
    //        + "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //    function getActivities(pageToken, maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/activities?"
    //        + "part=snippet,contentDetails"
    //        + "&home=true"
    //        + "&maxResults=" + maxResults;
    //        if (pageToken){
    //            url += "&pageToken=" + pageToken;
    //        }
    //        return get(url);
    //    }
    //
    //    function getMyChannel(all) {
    //        var url = "https://www.googleapis.com/youtube/v3/channels?";
    //        url += all ? "part=snippet,statistics,brandingSettings,contentDetails": "part=snippet";
    //        url += "&mine=true";
    //
    //        return get(url);
    //    }
    //
    //    function getChannel(channelId, all){
    //        var url = "https://www.googleapis.com/youtube/v3/channels?";
    //        url += all ? "part=snippet,statistics,brandingSettings,contentDetails" : "part=snippet";
    //        url += "&id=" + channelId
    //            + "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //    function getChannels(channelIds,maxResults,all){
    //        var ids = channelIds.join(',');
    //
    //        var url = "https://www.googleapis.com/youtube/v3/channels?";
    //        url += all ? "part=snippet,statistics,brandingSettings,contentDetails": "part=snippet";
    //        url += "&id=" + ids
    //            + "&maxResults=" + maxResults
    //            + "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //
    //    function getVideos(videoIds,maxResults,all) {
    //        var ids = videoIds.join(',');
    //
    //        var url = "https://www.googleapis.com/youtube/v3/videos?";
    //        url += all ? "part=snippet,contentDetails,statistics" : "part=snippet,contentDetails";
    //        url+= "&id=" + ids
    //            + "&maxResults=" + maxResults
    //            + "&key=" + apiKey;
    //
    //        return await Get(url);
    //    }
    //
    //    function getUserVideos(videoIds, maxResults,all) {
    //        var ids = videoIds.join(',');
    //
    //        var url = "https://www.googleapis.com/youtube/v3/videos?";
    //        url += all ? "part=snippet,contentDetails,statistics" : "part=snippet,contentDetails";
    //        url+= "&id=" + ids
    //            + "&maxResults=" + maxResults;
    //
    //        return get(url);
    //    }
    //
    //    function GetRating(videoId){
    //        var url = "https://www.googleapis.com/youtube/v3/videos/getRating?"
    //        + "id=" + videoId;
    //
    //        return get(url);
    //    }
    //
    //    // type = "channel,video,playlist"
    //    // var order = "date"
    //    function Search(q, type, order, publishedAfter, pageToken , maxResults)
    //    {
    //        var url = "https://www.googleapis.com/youtube/v3/search?"
    //        + "part=snippet"
    //        + "&maxResults=" + maxResults
    //        //+ "&order=" + order
    //        + "&q=" + q
    //        + "&type=" + type;
    //        if (publishedAfter){
    //            url += "&publishedAfter=" + publishedAfter;
    //        }
    //        if (pageToken){
    //            url += "&pageToken=" + pageToken;
    //
    //        }
    //        url += "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //    function SearchForChannel(channelId, q, type, order, publishedAfter, pageToken , maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/search?"
    //        + "part=snippet"
    //        + "&channelId=" + channelId
    //        + "&maxResults=" + maxResults
    //        //+ "&order=" + order
    //        + "&q=" + q
    //        + "&type=" + type
    //        + "&regionCode=" + regionCode;
    //        if (!var.IsNullOrEmpty(publishedAfter))
    //        {
    //            url += "&publishedAfter=" + publishedAfter;
    //        }
    //        if (!var.IsNullOrEmpty(pageToken))
    //        {
    //            url += "&pageToken=" + pageToken;
    //        }
    //        url += "&key=" + apiKey;
    //
    //        return await Get(url);
    //    }
    //
    //    function SearchRelatedVideos(videoId, maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/search?"
    //        + "part=snippet"
    //        + "&maxResults=" + maxResults
    //        + "&relatedToVideoId=" + videoId
    //        + "&type=video"
    //        + "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //    function SearchUserVideos(pageToken, maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/search?"
    //        + "part=snippet"
    //        + "&forMine=true"
    //        + "&maxResults=" + maxResults
    //        + "&type=video";
    //        if (pageToken){
    //            url += "&pageToken=" + pageToken;
    //
    //        }
    //        return await Get(url, token);
    //    }
    //
    //    // order date
    //    function SearchVideosOfChannel(channelId, order, pageToken, maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/search?"
    //        + "part=snippet"
    //        + "&channelId=" + channelId
    //        + "&maxResults=" + maxResults
    //        + "&order=" + order
    //        + "&type=video";
    //        if (pageToken){
    //            url += "&pageToken=" + pageToken;
    //
    //        }
    //        url += "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //    function GetSuggestions(q, maxResults) {
    //        var url = "http://suggestqueries.google.com/complete/search?"
    //        + "q=" + q
    //        + "&client=firefox"
    //        + "&ds=yt"
    //        + "&hl=" + regionCode;
    //
    //        return get(url);
    //    }
    //
    //    // var order = "unread"
    //    function GetSubscriptions(channelId, order, pageToken, maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/subscriptions?"
    //        + "part=snippet,contentDetails"
    //        + "&channelId=" + channelId
    //        + "&maxResults=" + maxResults
    //        + "&order=" + order;
    //        if (pageToken)
    //        {
    //            url += "&pageToken=" + pageToken;
    //        }
    //        url += "&key=" + apiKey;
    //
    //        return get(url);
    //    }
    //
    //    function GetUserSubscriptions(order, pageToken, maxResults){
    //        var url = "https://www.googleapis.com/youtube/v3/subscriptions?"
    //        + "part=snippet,contentDetails"
    //        + "&maxResults=" + maxResults
    //        + "&mine=true"
    //        + "&order=" + order;
    //        if (pageToken)
    //        {
    //            url += "&pageToken=" + pageToken;
    //        }
    //
    //        return get(url);
    //    }
    //
    //    function GetSubscription(channelId) {
    //        var url = "https://www.googleapis.com/youtube/v3/subscriptions?"
    //        + "part=snippet,contentDetails"
    //        + "&forChannelId=" + channelId
    //        + "&mine=true";
    //
    //        return get(url);
    //    }

    return {
        getCategories : getCategories,
        getMostPopularVideos : getMostPopularVideos,
        getVideo : getVideo
    }
}();

