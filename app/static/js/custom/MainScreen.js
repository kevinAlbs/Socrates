var MainScreen = (function(){
    var curChooser = null;//current field chooser
    var that = {};
    var working_set_cache = null,
		working_set_id = null;
    that.show = function(){
      $(".screen.main").show();
    };

    that.hide = function(){
      $(".screen.main").hide();
    };


    function passCollectionPhase(){
      $(".type-instructions").hide();
      $("#topbar .item").removeClass("active");
      //show next steps
      $("#next-buttons").fadeIn()
    }


    /*
	BEGIN FUNCTIONS FOR WORKING SETS
	 */
	that.setCurrentWorkingSet = function(ws, cache){
		working_set_id = ws["working_set_id"];
		if(cache){
			working_set_cache = ws;
		}
	}
	that.getCurrentWorkingSetID = function(){
		return working_set_id;
	}
	that.clearWorkingSetCache = function(){
		working_set_cache = null;
	}
	that.getWorkingSet = function(refID, callback){
		//check if cached
		if(working_set_cache != null && working_set_id == refID){
			callback.call(window, working_set_cache);
		}
		else{
			//download fresh data
			$.ajax({
				url: UTIL.CFG.api_endpoint,
				dataType: "json",
				type: "POST",
				data: JSON.stringify({
					'fetch' : true,
					'returnAllData': true,
					'working_set_id': refID,
					'format':'json'
				}),
				contentType:"application/json",
				success : function(data, stat, jqXHR){
					working_set_cache = data;
					if(callback){
						callback.call(window, data);
					}
				},
				error: function(){
					UI.feedback("Error fetching dataset", true);
				}
			});
		}
	}

	that.removeWorkingSet = function(working_set_id, callback){
		UI.toggleLoader(true);
		$.ajax({
			url: UTIL.CFG.api_endpoint,
			dataType: "json",
			type: "POST",
			data: JSON.stringify({
				'remove' : true,
				'working_set_id': working_set_id
			}),
			contentType:"application/json",
			success : function(data, stat, jqXHR){
				working_set_cache = data;
				if(callback){
					callback.call(window, data);
				}
				UI.toggleLoader(false);
			},
			error: function(){
				UI.feedback("Error removing dataset", true);
				UI.toggleLoader(false);
			}
		});
	}

	that.renameWorkingSet = function(working_set_id, new_name, callback){
		UI.toggleLoader(true);
		$.ajax({
			url: UTIL.CFG.api_endpoint,
			dataType: "json",
			type: "POST",
			data: JSON.stringify({
				'rename' : true,
				'new_name' : new_name,
				'working_set_id': working_set_id
			}),
			contentType:"application/json",
			success : function(data, stat, jqXHR){
				if(callback){
					callback.call(window);
				}
				UI.toggleLoader(false);
			},
			error: function(){
				UI.feedback("Error renaming dataset", true);
				UI.toggleLoader(false);
			}
		});
	}

	//downloads just dataset as CSV
	that.downloadDatasetCSV = function(working_set_id){
		that.getWorkingSet(working_set_id, function(working_set){
					var json = JSON.stringify(working_set);
		})
		var url = UTIL.CFG.api_endpoint + "?force_download=true&fetch=true&datasetonly=true&format=csv&username=" + UI.getUsername() + "&password=" + UI.getPassword() + "&working_set_id=" + working_set_id
		$.ajax({
			url: url,
			dataType: "text",
			type: "GET",
			contentType:"application/json",
			success : function(data, stat, jqXHR){
				download(data, "dataset.csv", "text/plain");

			},
			error: function(){
				UI.feedback("Error in downloadDatasetCSV", true);
				UI.toggleLoader(false);
			}
		});

		//var win = window.open();
		}


//downloads just dataset as JSON
	that.downloadDatasetJSON = function(working_set_id){
		that.getWorkingSet(working_set_id, function(working_set){
					var json = JSON.stringify(working_set);
		})
		var url = UTIL.CFG.api_endpoint + "?force_download=true&fetch=true&datasetonly=true&format=json&username=" + UI.getUsername() + "&password=" + UI.getPassword() + "&working_set_id=" + working_set_id
		$.ajax({
			url: url,
			dataType: "json",
			type: "GET",
			contentType:"application/json",
			success : function(data, stat, jqXHR){
				download(JSON.stringify(data,undefined,2), "dataset.json", "text/plain");

			},
			error: function(){
				UI.feedback("Error in downloadDatasetJSON", true);
				UI.toggleLoader(false);
			}
		});

		//var win = window.open();
		}


//downloads entire workflow as JSON
	that.downloadWorkingSet = function(working_set_id){
		that.getWorkingSet(working_set_id, function(working_set){
      		var json = JSON.stringify(working_set);
      		//var win = window.open("data:application/csv;charset=utf8," + encodeURIComponent(json), "_blank");

		})
		// download("hello world", "dlText.txt", "text/plain");
		var url = UTIL.CFG.api_endpoint + "?force_download=true&fetch=true&datasetonly=false&format=json&username=" + UI.getUsername() + "&password=" + UI.getPassword() + "&working_set_id=" + working_set_id
		$.ajax({
			url: url,
			dataType: "json",
			type: "GET",
			contentType:"application/json",
			success : function(data, stat, jqXHR){
				download(JSON.stringify(data,undefined,2), "workflow.json", "text/plain");

			},
			error: function(){
				UI.feedback("Error in downloadWorkingSet", true);
				UI.toggleLoader(false);
			}
		});
	}

	/*
	END FUCNTIONS FOR WORKING SETS
	 */



    /*
    Get all specs, build forms, set up event listeners
    */
    that.init = function(){
        console.log("hello");
      UI.toggleLoader(true);
      $.ajax({
        url: UTIL.CFG.api_endpoint,
        dataType: "json",
        data : JSON.stringify({
            "specs" : true
        }),
        contentType: "application/json",
        type: "POST",
        error: function(){
          UI.feedback("Cannot fetch specs", true);
          UI.toggleLoader(false);
        },
        success : function(data, stat, jqXHR){
          if(!UI.isLoggedIn()) {
            console.log("Switching");
            UI.switchScreen("login");
          }
          UI.toggleLoader(false);
          console.log(UTIL.CFG.api_endpoint)
          console.log(data);
          //Add Visualization specs
          // data = VIS.specs;
          data.visualization = VIS.specs;
          //generate all forms
          var types = ["analysis", "collection", "visualization"];
          for(var i = 0; i < types.length; i++){
            var type = types[i];
            console.log("TYPE");
            console.log(type);
            for(var mod in data[type]){
              console.log("MOD");
              console.log(mod);
              if(!data[type].hasOwnProperty(mod)){
                continue;
              }
              //make top level button for module
              $(".type-instructions." + type + " .modules").append("<button class='button' href='#' data-type='" + type + "' data-mod='" + mod + "'>" + mod + "</button>");
              var fns = data[type][mod].functions;
              for(var fn in fns){
                if(!fns.hasOwnProperty(fn)){
                  continue;
                }
                var dom_form = $("<div class='function' data-type='" + type + "' data-fn='" + fn + "' data-mod='" + mod + "'></div>");
                dom_form.append("<h4>" + fn + "</h4>");
                dom_form.append(genForm(fns[fn].param, type, fns[fn].param_order));
                //make sub level button for functio
                $(".type-instructions." + type + " .functions").append("<button class='button' href='#' data-type='" + type + "' data-fn='" + fn + "' data-mod='" + mod + "'>" + fn + "</button>")
                $("#forms").append(dom_form);
              }
            }
          }

          // Add functions to download buttons
          $("#entireworkflow").click(onDownloadWorkflowButtonClicked);
          $("#datasetjson").click(onDownloadDatasetJSONButtonClicked);
          $("#datasetcsv").click(onDownloadDatasetCSVButtonClicked);


          //add listeners on submission
          $(".function form").on("submit", function(e){
            e.preventDefault();
            var form = $(this),
                div = form.parent(),
                inputs = form.find("input.toSend"),
                selects = form.find("select.toSend"),
                type = div.attr("data-type"),
                mod = div.attr("data-mod"),
                fn = div.attr("data-fn"),
                setName = "Untitled",
                params = {
                  "type": type,
                  "module" : mod,
                  "function" : fn
                };
            if (type == "collection"){
              if (form.find("#setName").val()){
                setName = form.find("#setName").val();
                params["working_set_name"] = setName;
              }
            }
            $(this).parent().hide();
            passCollectionPhase();
            //show analysis/visualization buttons
            params["input"] = {};
            params['return_all_data'] = $("#allData").prop("checked") ? true : false;
            if((type == "analysis" || type == "visualization") && that.getCurrentWorkingSetID() != null){
              //add current reference id
              params["working_set_id"] = that.getCurrentWorkingSetID();
            }
            for(var i = 0; i < inputs.size(); i++){
              var inp = $(inputs.get(i));
              params["input"][inp.attr("name")] = inp.val();
            }
            for(var i = 0; i < selects.size(); i++){
              var sel = $(selects.get(i));
              params["input"][sel.attr("name")] = sel.val();
            }

            if(UI.isLoggedIn()){
              params["username"] = UI.getUsername();
              params["password"] = UI.getPassword();
            }
            //ajax call
            if(type == "visualization"){
              var b = createBox('visualization');
              b.find("h2").html("Exploration Results");
              b.find("h2").parent().append(closeBoxButton());
              VIS.callFunction(b[0], mod, fn, params,
                function(){
                  $("#workspace").append(b);
                  b.hide().fadeIn();
                    //Code "borrowed" from http://stackoverflow.com/questions/8973711/export-an-svg-from-dom-to-file
                    // Add some critical information
                    var svg = b.find("svg");
                    svg.attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"});
                    var svg = '<svg>' + svg.html() + '</svg>';
                    var b64 = btoa(svg); // or use btoa if supported
                    // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
                    b.append($("<a target='_blank' href-lang='image/svg+xml' class='button' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download</a>"));
                });
            }
            else{
              UI.toggleLoader(true);
              //clear cache, since now working set is modified
              that.clearWorkingSetCache();
              console.log(params)
               $.ajax({
                  url: UTIL.CFG.api_endpoint,
                  dataType: "json",
                  type: "POST",
                  data: JSON.stringify(params),
                  contentType: "application/json",
                  success : function(data, stat, jqXHR){
                    console.log("Operator output:");
                    console.log(data);
                    if(data.hasOwnProperty("error")){
                      UI.feedback(data.message, true);
                      return;
                    }
                    showResults(data, type);
                    if(params['return_all_data']){
                      //then this can be put in cache
                      that.setCurrentWorkingSet(data, true);
                    } else {
                      that.setCurrentWorkingSet(data, false);
                    }
                    //if this was a collection type, show output meta and move onto analysis stage
                    //if this was an analysis type, show output and additional analysis options
                  },
                  complete: function(jqXHR, stat){
                    console.log("Complete: " + stat);
                    UI.toggleLoader(false);
                  }
                });
            }

          });
          //add listeners for buttons (selects #collection a, #analysis a, etc.)
          $(".type-instructions .modules .button").on("click", function(e){
            e.preventDefault();
            //hide all sub menus and forms
            var a = $(this),
                type = a.attr("data-type"),
                mod = a.attr("data-mod");
            var typ = $(".type-instructions." + type);
            typ.find(".mod > .chosen").html(mod);
            typ.find(".fn").fadeIn();
            $(".type-instructions .button, #forms .function").hide();
            typ.find(".functions .button[data-type=" + type + "][data-mod=" + mod + "]").fadeIn();
          });
          $(".type-instructions .functions .button, .type-instructions .sub.fn").on("click", function(e){
            e.preventDefault();
            var a = $(this),
                type = a.attr("data-type"),
                mod = a.attr("data-mod"),
                fn = a.attr("data-fn");
            $(".type-instructions." + type + " .fn > .chosen").html(fn);
            //hide sub menu and forms
            $(".type-instructions .functions .button, #forms .function").hide();
            $("#forms .function[data-type=" + type + "][data-mod=" + mod + "][data-fn=" + fn + "]").fadeIn();
          });

          $(".fieldChooser").click(function(){
            var fType = $(this).attr("data-fieldtype");
            curChooser = $(this);
            showFields(fType);
          });

          $("#workspace").delegate(".field.option", "click" ,function(){
            if(curChooser != null){
              //set input
              var type = $(this).attr('data-type');
              var finalStr = $(this).html();
              curChooser.html(finalStr);
              if(type == "analysis"){
                finalStr = "analysis[" + $(this).attr("data-index") + "]." + finalStr;
              }
              curChooser.siblings("input").val(finalStr);
              showFields(null);
            }
          })
          showType("collection"); //initially show collection
        }
      });

      $("#download").click(function(e){
        e.preventDefault();
        $("#view textarea, #view #close").fadeIn();
        $.ajax({
                url: UTIL.CFG.api_endpoint + "fetch",
                dataType: "json",
                type: "GET",
                data: {'working_set_id': $("#view #refID").val(), 'returnAllData': "true"},
                success : function(data, stat, jqXHR){
                  that.setCurrentWorkingSet(data);
                  $("#view textarea").html(JSON.stringify(data));
                },
            });
      });
      $("#close").click(function(e){
        e.preventDefault();
        $(this).fadeOut();
        $("#view textarea").fadeOut();
      })

      $("#topbar .c").click(function(){
        showType("collection");
        $("#topbar .item").removeClass("active");
        $(this).addClass("active");
      });
      $("#topbar .a").click(function(){
        showType("analysis");
        $("#topbar .item").removeClass("active");
        $(this).addClass("active");
      });
      $("#topbar .v").click(function(){
        showType("visualization");
        $("#topbar .item").removeClass("active");
        $(this).addClass("active");
      })


      $(".sub.mod, .sub.fn").on("click", function(){
        $(this).find(".chosen").html("");
        showType($(this).attr("data-type"));
        $("#topbar .item").removeClass("active");
        $("#topbar .item.c").addClass("active");
      });

      $("#next-buttons .button").on("click", function(){
        if($(this).attr("data-type") == "a"){
          showType('analysis');
        }
        else{
          showType('visualization');
        }
      });

      $.ajax({
        url : "https://api.github.com/repos/InfoSeeking/Socrates",
        dataType: "json",
        contentType: "application/json",
        success : function(json){
          console.log(json);
          var dateStr = json.pushed_at + "";
          $("#last-modified").html("SOCRATES last updated on " + dateStr.replace(/[TZ]/g, ' '));
        }
      })

      $("#settings-btn").click(function(){
        if (UI.isLoggedIn()){
          UI.switchScreen("settings");
        }
      });

      $("#import-btn").click(function(){
        $("#fileupload").click();
      });


      $("#showAllData").on("click", handleDataButton);


    }
    /*
    Shows the overlay with a table of your data. (can be collection only, collection + single analysis, or collection + every analysis)
    index only necessary if it is an analysis type
    */
    function showAllData(working_set, typ, index){
      console.log("Showing data for " + typ + "," + index);
      var aData = null;
      var ws = working_set;//easier
      if(typ == "analysis"){
        //show the entry data alongside collection data
        if(index !== null){
          //show only one
          aData = new Array(ws["analysis"][index]);
        }
        else{
          aData = ws["analysis"];
        }
      }

      var cData = ws["data"];
      //build the top row
      var thead = $("<tr><th>Index</th></tr>");
      for(var f in ws["meta"]){
        if(ws["meta"].hasOwnProperty(f)){
          thead.append("<th>" + f + "</th>");
        }
      }

      //add heading for every analysis
      if(aData){
        console.log(aData);
        for(var i = 0; i < aData.length; i++){
          for(var f in aData[i]["entry_meta"]){
            if(aData[i]["entry_meta"].hasOwnProperty(f)){
              thead.append("<th class='a'>" + f + "</th>");
            }
          }
        }
      }

      var tbody = $("<tbody></tbody>");
      for(var i = 0; i < cData.length; i++){
        var row = $("<tr><td> " + i + "</td></tr>");
        for(var f in ws["meta"]){
          if(ws["meta"].hasOwnProperty(f)){
            row.append("<td>" + cData[i][f] + "</td>");
          }
        }
        if(aData){
          for(var j = 0; j < aData.length; j++){
            for(var f in aData[j]["entry_meta"]){
              if(aData[j]["entry_meta"].hasOwnProperty(f)){
                row.append("<td class='a'>" + aData[j]["entry_analysis"][f][i] + "</td>");
              }
            }
          }
        }
        tbody.append(row);
      }

      //now add rows
      var html = $("<table></table>").empty().append(thead).append(tbody);
      UI.overlay(html, "data", "Your Data");
    }

    function handleDataButton(e){
      UI.toggleLoader(true);
      var btn = $(this);
      that.getWorkingSet(that.getCurrentWorkingSetID(), function(ws){
          var typ = btn.attr("data-type");
          var index = btn.attr("data-index");
          if(index){
            index = parseInt(index);
          }
          showAllData(ws, typ, index);

          UI.toggleLoader(false);
      })

      e.preventDefault();
    }
    function showAllDataBtn(){
      return $("<a href='#' class='button'>Show All of this Data</a>").on("click", handleDataButton);
    }

    function showType(type){
      $(".type-instructions").hide();
      var typ = $(".type-instructions." + type).show();
      typ.find(".sub.mod").show();
      console.log(typ.find(".button"));
      typ.find(".sub.fn").hide();
      typ.find(".button").hide();
      typ.find(".modules .button").show();
    }

    function createTable(type, set){
      var section;
      if(type == "collection"){
        var table = $("<table></table>");
        table.append("<thead><tr><th>Field</th><th>Type</th><th>Sample (from first entry)</th></tr></thead><tbody></tbody>");
        for(var field in set.meta){
          if(!set.meta.hasOwnProperty(field)){continue;}
          var type = set.meta[field];
          if(typeof(type) == "object"){
            type = type.type;//lol
          }
          var sample = "";
          if(set.data.length > 0){
            sample = set.data[0][field];
          }
          else{
            return section;
          }
          if((typeof(sample) == "string") && sample.length > 30){
            sample = sample.substring(0, 30) + "...";
          }
          var row = $("<tr><td><span class='field' data-type='collection' data-fieldtype='" + type + "'>" + field + "</span></td><td>" + type + "</td><td>" + sample + "</td></tr>");
          table.find("tbody").append(row);
          section = table;
        }
      }
      else if(type == "analysis"){
        var index = set.analysis.length - 1;
        var an = set.analysis[index];
        var a_section = $("<div class='analysis_section'></div>");
        if(an.hasOwnProperty("aggregate_meta")){
          //check for aggregate data
          a_section.append("<h4>Aggregate Data</h4>");
          var table = $("<table></table>");
          table.append("<thead><tr><th>Field</th><th>Type</th><th>Value</th></tr></thead><tbody></tbody>");
          for(var field in an.aggregate_meta){
            if(!an.aggregate_meta.hasOwnProperty(field)){continue;}
            var type = an.aggregate_meta[field];
            if(typeof(type) == "object"){
              type = type.type;//lol
            }
            var sample = an.aggregate_analysis[field];
            var row = $("<tr><td>" + field + "</td><td>" + type + "</td><td>" + sample + "</td></tr>");
            table.find("tbody").append(row);
          }

          a_section.append(table);
        }

        if(an.hasOwnProperty("entry_meta")){
          //show entry data
          a_section.append("<h4>Entry Data</h4>");
          var table = $("<table></table>");
          table.append("<thead><tr><th>Field</th><th>Type</th><th>Sample (from first entry)</th></tr></thead><tbody></tbody>");
          for(var field in an.entry_meta){
            if(!an.entry_meta.hasOwnProperty(field)){continue;}
            var type = an.entry_meta[field];
            if(typeof(type) == "object"){
              type = type.type;//lol
            }
            var sample = "";
            if(an.entry_analysis[field].length > 0){
              sample = an.entry_analysis[field][0];
            }
            var row = $("<tr><td><span class='field' data-type='analysis' data-index='" + index + "' data-fieldtype='" + type + "'>" + field + "</span></td><td>" + type + "</td><td>" + sample + "</td></tr>");
            table.find("tbody").append(row);
          }
          a_section.append(table);
        }
        section = a_section;
      }
      return section;
    }
    function createBox(type, index){
      //create a new empty box
      return $("<div class='results " + type + "'><div class='bar group'><h2></h2></div></div>");
    }

    function downloadButtonFunction(downloadFunction){
      var btn = $(this);
      UI.toggleLoader(true);
      that.getWorkingSet(that.getCurrentWorkingSetID(), function(ws){
        var typ = btn.attr("data-type");
        var index = btn.attr("data-index");
        if(index){
          index = parseInt(index);
        }
        downloadFunction(that.getCurrentWorkingSetID());
        UI.toggleLoader(false);
      });
    }

//activated when download dataset as json button is clicked
    function onDownloadDatasetJSONButtonClicked(){
      downloadButtonFunction(that.downloadDatasetJSON);
    }

//activated when download dataset as csv button is clicked
    function onDownloadDatasetCSVButtonClicked(){
      downloadButtonFunction(that.downloadDatasetCSV);
    }

//activated when download workflow button is clicked
    function onDownloadWorkflowButtonClicked(){
      downloadButtonFunction(that.downloadWorkingSet);

    }


    function removeData(){
      $("#data-list").toggleClass("remove");
    }

    function closeBoxButton(){
      return $("<a class='button close'>X</a>").click(closeBox);
    }

    function manageDownloadButtons(){
      var count = $('.results.analysis').length //counts how many analyses there are
      if (count!=0){
        //shows download workflow button
        $("#entireworkflow").css("display", "block");
      }else{
        $("#entireworkflow").css("display", "none");
      }
      var ct = $('.results.collection').length //counts how many collections there are
      if (ct!=0){
        //show download dataset buttons
        $("#datasetjson").css("display", "block");
        $("#datasetcsv").css("display", "block");
      }else{
        $("#datasetjson").css("display", "none");
        $("#datasetcsv").css("display", "none");
      }
    }


    function closeBox(){
      //add confirmation check whether to continue or not
      if(confirm("Are you sure to want to delete this?")){
        $(this).parent().parent().detach();
      }

      manageDownloadButtons(); //check whether to show or hide buttons
    }


    function csvesc(txt){
        return ("" + txt).replace(/,|\n/g, "");
    }

    function downloadBoxXML(working_set){
      var xml = "<XML>";
      xml += json2xml(working_set);
      xml += "</XML>"

      var win = window.open("data:application/csv;charset=utf8," + encodeURIComponent(xml), "_blank");
    }

    function downloadBoxjson(working_set){
      var json = JSON.stringify(working_set);

      var win = window.open("data:application/csv;charset=utf8," + encodeURIComponent(json), "_blank");
    }

    function downloadBoxtsv(working_set, typ, index){
      var aData = null;
      var ws = working_set;//easier
      var tsv = "";
      if(typ == "analysis"){
        //show the entry data alongside collection data
        if(index !== null){
          //show only one
          aData = new Array(ws["analysis"][index]);
        }
        else{
          aData = ws["analysis"];
        }
      }

      var cData = ws["data"];
      //build the top row
      var thead = $("<tr><th>Index</th></tr>");
      var first = true;
      for(var f in ws["meta"]){
        if(ws["meta"].hasOwnProperty(f)){
          if(first){
            first = false;
          }
          else{
            tsv += "\t";
          }
          tsv += csvesc(f);
        }
      }
      //add heading for every analysis
      if(aData){
        for(var i = 0; i < aData.length; i++){
          for(var f in aData[i]["entry_meta"]){
            if(aData[i]["entry_meta"].hasOwnProperty(f)){
        tsv += "\t" + csvesc(f);
            }
          }
        }
      }
      tsv += "\n";
      for(var i = 0; i < cData.length; i++){
        var row = $("<tr><td> " + i + "</td></tr>");
        first = true;
        for(var f in ws["meta"]){
          if(ws["meta"].hasOwnProperty(f)){
            if(first){
              first = false;
            }
            else{
              tsv += "\t";
            }
            tsv += csvesc(cData[i][f]);
          }
        }
        if(aData){
          for(var j = 0; j < aData.length; j++){
            for(var f in aData[j]["entry_meta"]){
              if(aData[j]["entry_meta"].hasOwnProperty(f)){
                tsv += "\t" + csvesc(aData[j]["entry_analysis"][f][i]);
              }
            }
          }
        }
        tsv += "\n";
      }
      var win = window.open("data:application/tsv;charset=utf8," + encodeURIComponent(tsv), "_blank");
    }

    function downloadBoxcsv(working_set, typ, index){
    var aData = null;
    var ws = working_set;//easier
    var csv = "";
    if(typ == "analysis"){
    //show the entry data alongside collection data
    if(index !== null){
      //show only one
      aData = new Array(ws["analysis"][index]);
    }
    else{
      aData = ws["analysis"];
    }
    }

    var cData = ws["data"];
    //build the top row
    var thead = $("<tr><th>Index</th></tr>");
    var first = true;
    for(var f in ws["meta"]){
    if(ws["meta"].hasOwnProperty(f)){
      if(first){
        first = false;
      }
      else{
        csv += ",";
      }
      csv += csvesc(f);
    }
    }
    //add heading for every analysis
    if(aData){
    for(var i = 0; i < aData.length; i++){
      for(var f in aData[i]["entry_meta"]){
        if(aData[i]["entry_meta"].hasOwnProperty(f)){
    csv += "," + csvesc(f);
        }
      }
    }
    }
    csv += "\n";
    for(var i = 0; i < cData.length; i++){
    var row = $("<tr><td> " + i + "</td></tr>");
    first = true;
    for(var f in ws["meta"]){
      if(ws["meta"].hasOwnProperty(f)){
        if(first){
          first = false;
        }
        else{
          csv += ",";
        }
        csv += csvesc(cData[i][f]);
      }
    }
    if(aData){
      for(var j = 0; j < aData.length; j++){
        for(var f in aData[j]["entry_meta"]){
          if(aData[j]["entry_meta"].hasOwnProperty(f)){
            csv += "," + csvesc(aData[j]["entry_analysis"][f][i]);
          }
        }
      }
    }
    csv += "\n";
    }
    var win = window.open("data:application/csv;charset=utf8," + encodeURIComponent(csv), "_blank");
    }

    that.showWorkingSet = function(working_set, name){
      that.setCurrentWorkingSet(working_set);
      //clear current working set area
      $("#workspace").empty();
      console.log(working_set);
      //add box for collection
      showResults(working_set, "collection");
      //add box for each analysis

      if(working_set.analysis){
        for(var i = 0; i < working_set.analysis.length; i++){
          showResults(working_set, "analysis", i);
        }
      }
      passCollectionPhase();
    }
    /*
      Given the working_set, it will create a new box for the most recently created data.
    */
    function showResults(working_set, type, analysis_index){
      var setName = working_set["working_set_name"];
      if(showResults.first){
        showResults.first = false;
        $("#workspace #intro").hide(); //.detach()
      }
      //if type is collection, add collection data
      //if type is analysis, add most recent analysis
      var box = createBox(type);
      var h2 = box.find("h2");
      if(type == "collection"){
        that.setCurrentWorkingSet(working_set);
        //$("#download-json").attr("href", CFG.host + "/fetch/" + curRefId).show();
        h2.html("Collection");
        h2.append(" (" + setName + ")");
        var table = createTable(type, working_set);//this is the HTML created table
        box.append(table);
        box.append(showAllDataBtn().attr("data-type", "collection"));
        // box.append(getDownloadButton().attr("data-type", "collection"));
      }
      else if(type == "analysis"){
        h2.html("Analysis");
        h2.parent().append(closeBoxButton());
        box.append(createTable(type, working_set));
        var curIndex = working_set["analysis"].length - 1;
        if(analysis_index !== undefined){
          curIndex = analysis_index;
        }
        console.log("Showing " + curIndex);
        if(working_set["analysis"][curIndex].hasOwnProperty("entry_meta")){
          box.append(showAllDataBtn().attr("data-type", "analysis").attr('data-index', curIndex));
          // box.append(getDownloadButton().attr("data-type", "analysis").attr('data-index', curIndex));
        }
      }
      else if(type == "upload"){
        h2.html("Imported Data");
        h2.append(" (" + setName + ")");
        h2.parent().append(closeBoxButton());
        var table = createTable(type, working_set);//this is the HTML created table
        box.append(table);
        box.append(showAllDataBtn().attr("data-type", "collection"));
        // box.append(getDownloadButton().attr("data-type", "collection"));
      }
      $("#workspace").append(box);
      manageDownloadButtons();
      box.hide().fadeIn();
    }
    showResults.first = true;


    /*
    data should be an object containing fields
    fields can either be strings or objects
    ordering is an array of the field names (optional)
    */
    function genForm(data, type, ordering){
      var form = $("<form></form>");
      if(type == "analysis" || type == "visualization"){
        //add reference to database
        //form.append("<div class='row'><label>Reference ID</label><input type='text' class='toSend' name='reference_id'/></div>");
      }
      if(!ordering){
        //get the keys from data
        ordering = [];
        for(var p in data){
          if(data.hasOwnProperty(p)){
            ordering.push(p);
          }
        }
      }
      console.log(ordering);
      for(var n = 0; n < ordering.length; n++){
        var p = ordering[n];
        if(!data.hasOwnProperty(p)){continue;}
        var row = $("<div class='row'></div>");
        var input = null;
        var inputType = "text";
        var fieldType = "";
        var extra = "";
        if(typeof(data[p]) == "string"){
          fieldType = data[p];
        }
        else if(typeof(data[p] == "object")){
          fieldType = data[p].type;
        }
        switch(fieldType){
          case "numeric":
          input = $("<input type='number' step='any'/>");
          break;
          case "boolean":
          input = $("<select><option value='true'>True</option><option value='false'>False</option></select>");
          break;
          default:
          input = $("<input type='text' />");
          break;
        }
        var fr = /^field_reference\s+(\w+)$/i;
        var match = fr.exec(fieldType);
        if(match){
          input = $("<input type='hidden'/><span class='fieldChooser' data-fieldtype='" + match[1] + "'>Choose a Field</span>");
        }

        if(typeof(data[p] == "object")){
          //check other options
          var hasComment = false;
          var comment = $("<p class='comment'></p>");
          var optional = "";
          if(data[p].hasOwnProperty("optional") && data[p]["optional"]){
            hasComment = true;
            comment.append("<span class='optional'>(optional) </span>");
          }
          if(data[p].hasOwnProperty("comment")){
            hasComment = true;
            comment.append(data[p]["comment"]);
          }
          if(hasComment){
            row.append(comment);
          }
          if(data[p].hasOwnProperty("constraints")){
            if(data[p].constraints.hasOwnProperty("choices")){
              var choices = data[p].constraints.choices;
              //create select field
              input = $("<select></select>");
              for(var i = 0; i < choices.length; i++){
                input.append("<option value='" + choices[i] + "'>" + choices[i] + "</option>");
              }
            }
          }
          if(data[p].hasOwnProperty("default")){
              //only works for text/numeric fields right now, create a new method to set value
              input.val(data[p]["default"]);
          }
        }

        input.addClass("toSend").attr("name", p);
        row.prepend(input).prepend("<label>" + p + "</label>");//use prepend in case comments were added
        form.append(row);
      }
      form.append("<input type='submit' class='button' />");
      if (type == "collection"){
        //injection of dataset name field (ehh...)
        form.prepend("<div class='row'><label for='setName'>Dataset Name </label><input type='text' id='setName' value='Untitled'><p class='comment'><span class='optional'>(optional)</span></p></div>")
      }
      return form;
    }


    function showFields(type){
      $(".field").removeClass("option");
      if(type !== null){
        $(".field[data-fieldtype=" + type + "]").addClass("option");
      }
    }




    function json2xml(o, tab) {
      /*  This work is licensed under Creative Commons GNU LGPL License.

      License: http://creativecommons.org/licenses/LGPL/2.1/
       Version: 0.9
      Author:  Stefan Goessner/2006
      Web:     http://goessner.net/
    */
       var toXml = function(v, name, ind) {
          var xml = "";
          if (v instanceof Array) {
             for (var i=0, n=v.length; i<n; i++)
                xml += ind + toXml(v[i], name, ind+"\t") + "\n";
          }
          else if (typeof(v) == "object") {
             var hasChild = false;
             xml += ind + "<" + name;
             for (var m in v) {
                if (m.charAt(0) == "@")
                   xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                else
                   hasChild = true;
             }
             xml += hasChild ? ">" : "/>";
             if (hasChild) {
                for (var m in v) {
                   if (m == "#text")
                      xml += v[m];
                   else if (m == "#cdata")
                      xml += "<![CDATA[" + v[m] + "]]>";
                   else if (m.charAt(0) != "@")
                      xml += toXml(v[m], m, ind+"\t");
                }
                xml += (xml.charAt(xml.length-1)=="\n"?ind:"") + "</" + name + ">";
             }
          }
          else {
             xml += ind + "<" + name + ">" + v.toString() +  "</" + name + ">";
          }
          return xml;
       }, xml="";
       for (var m in o)
          xml += toXml(o[m], m, "");
       return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
    };

    return that;
}());

MainScreen.prototype = Screen;
