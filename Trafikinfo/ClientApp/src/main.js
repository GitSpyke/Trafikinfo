////{
////  "ConnectionStrings": {
////    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=_CHANGE_ME;Trusted_Connection=True;MultipleActiveResultSets=true"
////  }
////}

import { toLonLat } from 'ol/proj'

// jQuery
import $ from 'jquery'

export function SetUpAjax() {
    $.support.cors = true; // Enable Cross domain requests
    try {
        $.ajaxSetup({
            type: "POST",
            contentType: "text/xml",
            dataType: "json",
            url: "https://api.trafikinfo.trafikverket.se/v2/data.json",
            error: function (msg) {
                if (msg.statusText == "abort") return;
                alert("Walla, Request failed: " + msg.statusText + "\n" + msg.responseText);
            }
        });
    }
    catch (e) { alert("Ett fel uppstod vid initialisering."); }
}

function PerformAjax(update, map, set, data) {
    console.log("yes");
    return $.ajax({
        data: data,
        success: function (response) {
            if (response == null) return;
            update(response, map, set);//byt från update
        }
    });
}

export function GetNearbyStation(map, setStationCoordinates, setDepartures) {
    //setStationCoordinates([toLonLat(map.getView().getCenter())[0], toLonLat(map.getView().getCenter())[1]])//temp, fungerar inte
    return PerformAjax(GetDepartures, map, setDepartures, `<REQUEST><LOGIN authenticationkey="6a3d19e740114ade9e1ccc03d3eee5b1" /><QUERY objecttype="TrainStation" schemaversion="1.4"><FILTER><NEAR name="Geometry.WGS84" value="${toLonLat(map.getView().getCenter())[0]} ${toLonLat(map.getView().getCenter())[1]}" mindistance="0" maxdistance="4000" /></FILTER></QUERY></REQUEST>`)
}

function GetDepartures(response, map, setDepartures) {
    PerformAjax(UpdateDepartures, null, setDepartures, `<REQUEST><LOGIN authenticationkey="6a3d19e740114ade9e1ccc03d3eee5b1" /><QUERY objecttype="TrainAnnouncement" schemaversion="1.3" orderby="AdvertisedTimeAtLocation"><FILTER><AND><EQ name="ActivityType" value="Avgang" /><EQ name="LocationSignature" value="${response.RESPONSE.RESULT[0].TrainStation[0].LocationSignature}" /><OR><AND><GT name="AdvertisedTimeAtLocation" value="$dateadd(-00:15:00)" /><LT name="AdvertisedTimeAtLocation" value="$dateadd(14:00:00)" /></AND><AND><LT name="AdvertisedTimeAtLocation" value="$dateadd(00:30:00)" /><GT name="EstimatedTimeAtLocation" value="$dateadd(-00:15:00)" /></AND></OR></AND></FILTER><INCLUDE>AdvertisedTrainIdent</INCLUDE><INCLUDE>AdvertisedTimeAtLocation</INCLUDE><INCLUDE>TrackAtLocation</INCLUDE><INCLUDE>ToLocation</INCLUDE></QUERY></REQUEST>`)
    console.log(response.RESPONSE.RESULT[0].TrainStation[0].LocationSignature)//remove/ta bort
}

function UpdateDepartures(response, map, set) {
    let departures = []
    console.log(response.RESPONSE.RESULT[0].TrainAnnouncement)//testa JSON.Parse
    $(response.RESPONSE.RESULT[0].TrainAnnouncement).each(function (item) { departures.push((response.RESPONSE.RESULT[0].TrainAnnouncement[item].AdvertisedTimeAtLocation)); })
    set(departures)
}