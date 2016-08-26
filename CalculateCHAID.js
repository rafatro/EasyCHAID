// JavaScript Document
var dt; // global variable to store all the data to be used
var dt_h = [] // global variable to store the data column headings
var cat = []; // global variable to store a matrix (2D) of categories
var n; // global variable to store the number of observations
var col_dep; // global variable to store the column number for the dependent variable
var col_ind_i; // global variable to store the column number for the first independent varible
var col_ind_f; // global variable to store the column number for the last independent varible

function CalculateCHAID(currentStep, direction) {
	if (currentStep == 2 && direction) { // 1->2
		$('#step2_content').html('Loading...');
		dt = document.getElementById("Data").value.replace(/\r\n/g, "\n").split("\n");
		n = dt.length;
		var sep = $('#separator :selected').text();
		if (sep == "[TAB]") sep = "\t";
		for (var i = 0; i < n; i++) {
			dt[i] = dt[i].split(sep);
		}
		cols = dt[0].length; // number of columns taken from first row
		if ($('#headings').prop('checked')) {
			dt_h = dt[0]; // headings
			dt.splice(0, 1);
			n--;
		} else {
			for (var c = 0; c < cols; c++) {
				dt_h[c] = "col" + (c + 1); // headings
			}
		}
		// insert a check if matrix is full (all lines have the same num of columns
		for (var c = 0; c < cols; c++) {
			cat.push([
				[dt[0][c]]
			]);
		}
		for (var i = 1; i < n; i++) {
			for (var c = 0; c < cols; c++) {
				for (var ct = 0; ct < cat[c].length; ct++) {
					if (dt[i][c] == cat[c][ct]) break;
				}
				if (ct == cat[c].length) cat[c].push(dt[i][c]);
			}
		}
		var html = "<table border='1' cellspacing='0' cellpadding='5'>";
		if ($('#dep_var').find('option:selected').val() == 'first') {
			col_dep = 0;
			col_ind_i = 1;
			col_ind_f = cols - 1;
		} else {
			col_dep = cols - 1;
			col_ind_i = 0;
			col_ind_f = cols - 2;
		}
		var ncats;
		for (var c = 0; c < cols; c++) {
			ncats = cat[c].length;
			if (ncats > 20 || ncats > n * 0.8) var too_many_cats = true;
			else var too_many_cats = false;
			if (col_dep == c) {
				html += "<tr><td align='center' valign='top'>Dependent</td>"
			} else if (too_many_cats) html += "<tr><td align='center' valign='top'><input id='cat_ck_" + c + "' type='checkbox' disabled='disabled' /></td>"
			else html += "<tr><td align='center' valign='top'><input id='cat_ck_" + c + "' type='checkbox' checked='checked' /></td>"
			if (too_many_cats) html += "<td style='color:#666'><h2>" + dt_h[c] + "</h2>Too many categories to be used in CHAID.<br /></td></tr>"
			else {
				html += "<td><h2>" + dt_h[c] + "</h2>" + ncats + " categories:"
				for (ct = 0; ct < ncats; ct++) {
					html += " '" + cat[c][ct] + "'";
				}
				html += "<br /></td></tr>";
			}
		}
		html += "</table><br />";
		html += "<input type='text' id='pv_split_node' value='0.05' size='2' maxlength='12' style='text-align:right'/>";
		html += "<span style='font-size:20px; font-weight:bold'> p-value for splitting nodes</span><br />";
		html += "Significance level used for deciding to split a node based on the variable's discriminant power against the dependent variable. Larger p-values generate taller trees.<br /><br />";
		html += "<input type='text' id='pv_merge_cat' value='0.05' size='2' maxlength='12' style='text-align:right'/>";
		html += "<span style='font-size:20px; font-weight:bold'> p-value for merging categories</span><br />";
		html += "Significance level used for variables with more than 2 categories for deciding to merge two or more categories based on their similarity against the dependent variable. Larger p-values generate broader trees.<br /><br />";
		html += "<input type='text' id='min_terminal_node' value='8' size='2' maxlength='12' style='text-align:right'/>";
		html += "<span style='font-size:20px; font-weight:bold'> Minimum node size</span><br />";
		html += "If the splitting of a parent node would create a child node smaller than this, CHAID will try to merge it with the other most similar child node until the resulting merged child node is larger.<br />";
		$('#step2_content').html(html);
	} else if (currentStep == 3 && direction) { // 2->3
		$('#step3_content').html('Loading...');
		var tree = [];
		var merged_cat = []; // 3D matrix of merged categories (after merging the similar categories, if more than 2)
		var pairs = []; // 2D matrix: list of pairs from merged categories, identified by index. pairs[pair][2] is p-value for merging the pair.
		var dt_pair_ct = []; // Contingency table for merging a pair
		var dt_split_ct = []; // Contingency table for splitting a node
		var split_pv=[]; // vector with p-value for splitting the node by each variable
		for (node = 0;;) { // until every node is terminal or parent
			dt_node = dt;
			html = "";
			for (c = col_ind_i; c < col_ind_f + 1; c++) { // for every variable
				html += "c: " + c;
				// create merged_cat, puting the categories inside array
				merged_cat[c] = [];
				for (ct = 0; ct < cat[c].length; ct++) {
					merged_cat[c].push([cat[c][ct]]);
				}
				if (merged_cat[c].length > 2) {
					html += "Since " + dt_h[c] + " have more than 2 categories, attempting to merge similar categories...<br>";
					for (;;) { // until there is no more merging
						// create initial pairs of categories
						pairs = [];
						for (ct = 0; ct < merged_cat[c].length; ct++) {
							for (ct2 = ct + 1; ct2 < merged_cat[c].length; ct2++) {
								pairs.push([ct, ct2]);
							}
						}
						for (pair = 0; pair < pairs.length; pair++) { // for every pair
							// create contingency table with any of the categories in the pair or merged pair
							for (r = 0; r < 2; r++) {
								dt_pair_ct[r] = [];
								for (d = 0; d < cat[col_dep].length; d++) {
									dt_pair_ct[r][d] = 0; // zeroing the contingency table
								}
							}
							for (i = 0; i < n; i++) {
								F: for (r = 0; r < 2; r++) { // for every member of the pair
									for (j = 0; j < merged_cat[c][pairs[pair][r]].length; j++) { // checking if is in any category of the first member of the pair
										if (dt[i][c] == merged_cat[c][pairs[pair][r]][j]) {
											for (d = 0; d < cat[col_dep].length; d++) {
												if (dt[i][col_dep] == cat[col_dep][d]) {
													dt_pair_ct[r][d]++;
													break F;
												}
											}
										}
									}
								}
							}
							// Calculates p-value for merging categories
							pairs[pair][2] = 1 - pchisq(test_statistic(dt_pair_ct), (dt_pair_ct.length - 1) * (dt_pair_ct[0].length - 1));
							html += "Node: " + node + " | Var: " + dt_h[c] + " | Pair: " + pair + " | Members: "
							for (j = 0; j < merged_cat[c][pairs[pair][0]].length; j++) html += "'" + merged_cat[c][pairs[pair][0]][j] + "' ";
							html += " x ";
							for (j = 0; j < merged_cat[c][pairs[pair][1]].length; j++) html += "'" + merged_cat[c][pairs[pair][1]][j] + "' ";
							html += "| p-value: " + pairs[pair][2] + "<br>";
						}
						// Choosing highest p-value for merging
						pair_highest_pv = 0;
						pair_highest_pv_pv = 0;
						for (pair = 0; pair < pairs.length; pair++) {
							if (pairs[pair][2] > pair_highest_pv_pv) {
								pair_highest_pv = pair;
								pair_highest_pv_pv = pairs[pair][2];
							}
						}
						html += "Highest p-value: " + pair_highest_pv_pv + " pair: " + pair_highest_pv + "<br>";
						// checking against parameter and renewing merged_cat
						if (pair_highest_pv_pv > document.getElementById("pv_merge_cat").value) {
							// merging the first member of the best pair with the second member of the same pair
							merged_cat[c][pairs[pair_highest_pv][0]] = merged_cat[c][pairs[pair_highest_pv][0]].concat(merged_cat[c][pairs[pair_highest_pv][1]]);
							// deleting the second member
							merged_cat[c].splice(pairs[pair_highest_pv][1], 1);
							if (merged_cat[c].length == 2) {
								html += "Merging categories stopped because resulted in only 2 merged categories<br>";
								break;
							}
						} else {
							html += "Merging categories stopped because the resulting merged categories are not too similar.<br>";
							break;
						}
					}
				}
				// End of Merging
				// Beginning of Splitting
				// create contingency table with any of the categories in the merged pair
				dt_split_ct = [];
				for (r = 0; r < merged_cat[c].length; r++) {
					dt_split_ct[r] = [];
					for (d = 0; d < cat[col_dep].length; d++) {
						dt_split_ct[r][d] = 0; // zeroing the contingency table
					}
				}
				for (i = 0; i < n; i++) { // for every observation
					G: for (r = 0; r < merged_cat[c].length; r++) { // for every merged category
						for (j = 0; j < merged_cat[c][r].length; j++) { // for every member of merged category
							if (dt[i][c] == merged_cat[c][r][j]) {
								for (d = 0; d < cat[col_dep].length; d++) {
									if (dt[i][col_dep] == cat[col_dep][d]) {
										dt_split_ct[r][d]++;
										break G;
									}
								}
							}
						}
					}
				}
				html += "contingency table[0][0]: " + dt_split_ct[0][0] + "<br>";
				// Calculates p-value for merging categories
				split_pv[c] = 1 - pchisq(test_statistic(dt_split_ct), (dt_split_ct.length - 1) * (dt_split_ct[0].length - 1));
				//Add bonferroni!!
				html += "Var: " + dt_h[c] + " | p-value: " + split_pv[c] +"<br>";
				
				
				html += "<br>";
			}
			break;
		}
		$('#step3_content').html(html);
	}
}

function test_statistic(ct) {
	// Test statistic for the Test of independence
	// ct is the contingency table: a 2D matrix nxn with the frequency of observations like:
	// [32 21 42]
	// [25  0 54]
	var m = 0; // total number of observations
	var Oi_ = [];
	var O_j = [];
	var pi_ = [];
	var p_j = [];
	for (j = 0; j < ct[0].length; j++) O_j[j] = 0
	for (i = 0; i < ct.length; i++) {
		Oi_[i] = 0
		for (j = 0; j < ct[0].length; j++) {
			Oi_[i] += ct[i][j];
			O_j[j] += ct[i][j];
			m += ct[i][j];
		}
	}
	for (i = 0; i < Oi_.length; i++) pi_[i] = Oi_[i] / m;
	for (j = 0; j < O_j.length; j++) p_j[j] = O_j[j] / m;
	var sum = 0;
	for (i = 0; i < ct.length; i++) {
		for (j = 0; j < ct[0].length; j++) {
			sum += pi_[i] * p_j[j] * Math.pow((ct[i][j] / m - pi_[i] * p_j[j]) / (pi_[i] * p_j[j]), 2);
		}
	}
	return m * sum;
}