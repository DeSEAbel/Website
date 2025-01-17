function formatString(str) {
    // If "-" in string, split and keep the second part
    if (str.includes("-")) {
        str = str.split("-")[1];
    }
    let words = str.split("_");
    let formattedWords = [];
    for (let word of words) {
        formattedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    return formattedWords.join(" ");
}

function createLinkDiv(id, className = "sidebar-button") {
    var link = document.createElement("a");
    link.id = id;
    link.href = "#";
    link.textContent = formatString(id);
    link.className = "sidebar-button";
    return link;
}

function createLayerButton(id, ids) {
    console.log("createLayerButton: " + id);
    var link = createLinkDiv(id);
    link.onclick = function (e) {
        var clickedLayer = this.id;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, "visibility");

        // Toggle layer visibility by changing the layout object's visibility property.
        if (visibility === "visible") {
            map.setLayoutProperty(clickedLayer, "visibility", "none");
            this.className = "";
        } else {
            this.className = "sidebar-active";
            map.setLayoutProperty(clickedLayer, "visibility", "visible");
            // Set the other layers to invisible
            for (var layer of ids) {
                if (layer != clickedLayer) {
                    map.setLayoutProperty(layer, "visibility", "none");
                    document.getElementById(layer).className = "";
                }
            }
        }
    };

    return link;
}

function createLayersButton(ids, menu_name = "menu-animals") {
    // menu is the element where the buttons will be added. (e.g., Left toggle menu)
    var menu = document.getElementById(menu_name);

    // First remove all children
    while (menu.firstChild) {
        menu.removeChild(menu.firstChild);
    }

    for (const id of ids) {
        var link = createLayerButton(id, ids);
        menu.appendChild(link);
    }
}

async function initZones() {
    zones_of_interest = {};
    // var map_div = document.getElementById("map-div");
    // var loading = document.createElement("div");
    // loading.innerHTML = "Loading zones...";
    // loading.classList.add("loading-bar");
    // map_div.appendChild(loading);
    // var idx = 0;
    const createZone = async (zone_id) => {
        var zone = zones[zone_id];
        // var zone_name = zone.name;
        // idx += 1;
        // loading.innerHTML =
        //     "Loading zone " +
        //     zone_name +
        //     "... (" +
        //     idx +
        //     "/" +
        //     Object.keys(zones).length +
        //     ")";
        zones_of_interest[zone_id] = new ZoneOfInterest(
            (map = map),
            (width = zone.width),
            (height = zone.height),
            (step = zone.step),
            (longitude_west = zone.longitude_west),
            (latitude_north = zone.latitude_north),
            (precision = 5),
            (zone_id = zone_id)
        );
    };
    for (zone_id in zones) {
        await createZone(zone_id);
    }
    // map_div.removeChild(loading);
    add_zone_menu_divs();
    simulateClickOnZone(zone_id);
    return new Promise((resolve) => {
        resolve();
    });
}

function add_zone_menu_divs() {
    var menu = document.getElementById("menu-zones");
    for (zone_id in zones) {
        var link = createLinkDiv(zone_id);
        menu.appendChild(link);
    }
}

function add_noise_impactors_menu_divs() {
    var menu = document.getElementById("menu-noise-impactors");
    for (noise_impactor_id in noise_impactors) {
        var link = createLinkDiv(noise_impactor_id);
        menu.appendChild(link);
    }
    noise_impactor_id = Object.keys(noise_impactors)[0];
    simulateClickOnNoiseImpactor(noise_impactor_id);
}

async function simulateClickOnZone(zone_id) {
    current_zone_id = zone_id;
    zone_of_interest = zones_of_interest[current_zone_id];

    // run zone_of_interest.keepOnlyTilesInWater(); in then() of display
    zone_of_interest.display(map);
    // Create layers buttons for the zone of interest
    var marine_fauna = zones[current_zone_id].marine_fauna;
    if ((typeof marine_fauna != "undefined") & (marine_fauna != {})) {
        marine_fauna_layer_ids = Object.keys(marine_fauna).map(
            (x) => zone_id + "-" + x
        );
        createLayersButton(marine_fauna_layer_ids, menu="menu-animals");
        addsourceAndLayerFromConfig(map, marine_fauna, current_zone_id);
    } else {
        createLayersButton([], menu_name = "menu-animals");
    }
    document.getElementById(zone_id).className = "sidebar-active";
}
function simulateClickOnNoiseImpactor(noise_impactor_id) {
    current_noise_impactor_id = noise_impactor_id;
    console.log("current_noise_impactor_id: " + current_noise_impactor_id);
    document.getElementById(noise_impactor_id).className = "sidebar-active";
}

// Async function because it needs to wait for the zone_of_interest to be created in
// order to be able to run keepOnlyTilesInWater()
async function add_zones_menu(map) {
    var zone_ids = Object.keys(zones);
    for (var id of zone_ids) {
        var link = document.getElementById(id);

        link.onclick = function (e) {
            var clicked_zone_id = this.id;
            e.preventDefault();
            e.stopPropagation();

            const visibility = this.className;

            // Toggle layer visibility by changing the layout object's visibility property.
            if (visibility === "active") {
                console.log("already active");
                return;
            } else {
                this.className = "sidebar-active";
                //set the other zones to inactive
                for (var id of zone_ids) {
                    if (id !== clicked_zone_id) {
                        document.getElementById(id).className = "sidebar-button";
                    }
                }
                var previous_marine_fauna = [];
                if (typeof current_zone_id != "undefined") {
                    var previous_marine_fauna = zones[current_zone_id].marine_fauna;
                    // Set to invisible all previous_marine fauna
                    for (var animal in previous_marine_fauna) {
                        map.setLayoutProperty(
                            current_zone_id + "-" + animal,
                            "visibility",
                            "none"
                        );
                    }
                }
                current_zone_id = clicked_zone_id;
                zone_of_interest = zones_of_interest[current_zone_id];
                zone_of_interest.display(map);
                // Create layers buttons for the zone of interest
                var marine_fauna = zones[current_zone_id].marine_fauna;
                if ((typeof marine_fauna != "undefined") & (marine_fauna != {})) {
                    marine_fauna_layer_ids = Object.keys(marine_fauna).map(
                        (x) => current_zone_id + "-" + x
                    );
                    createLayersButton(marine_fauna_layer_ids, "menu-animals");
                    addsourceAndLayerFromConfig(map, marine_fauna, current_zone_id);
                } else {
                    createLayersButton([], menu_name = "menu-animals");
                }
            }
        };
    }
    return new Promise((resolve) => {
        resolve();
    });
}

function add_noise_impactors_menu(map) {
    var noise_impactor_ids = Object.keys(noise_impactors);
    for (var id of noise_impactor_ids) {
        var link = document.getElementById(id);
        link.onclick = function (e) {
            var clicked_noise_impactor_id = this.id;
            e.preventDefault();
            e.stopPropagation();

            const visibility = this.className;

            // Toggle layer visibility by changing the layout object's visibility property.
            if (visibility === "active") {
                console.log("already active");
                return;
            } else {
                this.className = "sidebar-active";
                //set the other noise_impactors to inactive
                for (var id of noise_impactor_ids) {
                    if (id !== clicked_noise_impactor_id) {
                        document.getElementById(id).className = "sidebar-button";
                    }
                }

                current_noise_impactor_id = clicked_noise_impactor_id;
                console.log("current_noise_impactor_id: " + current_noise_impactor_id);
            }
        };
    }
}

function createHeader() {
    const headerContainer = document.createElement("div");
    headerContainer.id = "header_container";

    const link1 = document.createElement("a");
    link1.href = "index.html";
    link1.innerHTML = "APPLICATION";
    headerContainer.appendChild(link1);

    const link2 = document.createElement("a");
    link2.href = "about.html";
    link2.innerHTML = "ABOUT DESEABEL";
    headerContainer.appendChild(link2);

    const link3 = document.createElement("a");
    link3.href = "team.html";
    link3.innerHTML = "TEAM";
    headerContainer.appendChild(link3);

    const link4 = document.createElement("a");
    link4.href = "get_involved.html";
    link4.innerHTML = "GET INVOLVED";
    headerContainer.appendChild(link4);

    document.body.insertBefore(headerContainer, document.body.firstChild);
}
