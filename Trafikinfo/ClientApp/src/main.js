import $ from 'jquery'

export function SetUpAjax() {
    //$.support.cors = true; // Enable Cross domain requests
    $.ajaxSetup({
        type: "POST",
        contentType: "text/xml",
        dataType: "json",
        url: "https://api.trafikinfo.trafikverket.se/v2/data.json",
        error: function (msg) {
            if (msg.statusText === "abort") return;
            alert("Request failed: " + msg.statusText + "\n" + msg.responseText);
        }
    });
}

async function doAjax(data) {
    return (await $.ajax({
        data: data
    }));
}

// loads stations and departures
export async function GetNearbyStation(setStationCoord, setDepartures, coordinates) {
    let stationData = await doAjax(`<REQUEST><LOGIN authenticationkey="6a3d19e740114ade9e1ccc03d3eee5b1" /><QUERY objecttype="TrainStation" schemaversion="1.4"><FILTER><NEAR name="Geometry.WGS84" value="${coordinates[0]} ${coordinates[1]}" mindistance="0" maxdistance="4000" /></FILTER></QUERY></REQUEST>`)
    setStationCoord(stationData.RESPONSE.RESULT[0].TrainStation[0].Geometry.WGS84.substr(7, 36).split(" "))
    let departuresData = await doAjax(`<REQUEST><LOGIN authenticationkey="6a3d19e740114ade9e1ccc03d3eee5b1" /><QUERY objecttype="TrainAnnouncement" schemaversion="1.3" orderby="AdvertisedTimeAtLocation"><FILTER><AND><EQ name="ActivityType" value="Avgang" /><EQ name="LocationSignature" value="${stationData.RESPONSE.RESULT[0].TrainStation[0].LocationSignature}" /><OR><AND><GT name="AdvertisedTimeAtLocation" value="$dateadd(-00:15:00)" /><LT name="AdvertisedTimeAtLocation" value="$dateadd(14:00:00)" /></AND><AND><LT name="AdvertisedTimeAtLocation" value="$dateadd(00:30:00)" /><GT name="EstimatedTimeAtLocation" value="$dateadd(-00:15:00)" /></AND></OR></AND></FILTER><INCLUDE>AdvertisedTrainIdent</INCLUDE><INCLUDE>AdvertisedTimeAtLocation</INCLUDE><INCLUDE>TrackAtLocation</INCLUDE><INCLUDE>ToLocation</INCLUDE></QUERY></REQUEST>`)
    let departures = []
    let results = departuresData.RESPONSE.RESULT[0]
    $(results.TrainAnnouncement).each(function (item) { departures.push(({ number: results.TrainAnnouncement[item].AdvertisedTrainIdent, time:results.TrainAnnouncement[item].AdvertisedTimeAtLocation.substr(11, 5) })); })//destination: results.TrainAnnouncement[item].ToLocation[0].LocationName, 
    setDepartures(departures.slice(0, 5))
}

// Create an ajax loading indicator
//var loadingtimer;
//$("#loader").hide();
//$(document).ajaxstart(function () {
//    loadingtimer = settimeout(function () {
//        $("#loader").show();
//    }, 200);
//}).ajaxstop(function () {
//    cleartimeout(loadingtimer);
//    $("#loader").hide();
//});