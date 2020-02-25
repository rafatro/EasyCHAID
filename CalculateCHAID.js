// JavaScript Document
var dt; // global variable to store all the data to be used
var dt_h = [] // global variable to store the data column headings
var cat = []; // global variable to store a matrix (2D) of categories
var n; // global variable to store the number of observations
var cols; // global variable to store the number of columns on the database
var col_dep; // global variable to store the column number for the dependent variable
var col_ind_i; // global variable to store the column number for the first independent varible
var col_ind_f; // global variable to store the column number for the last independent varible
var data_google; // global variable to store information for tree chart
var tree = []; // Each element of array is a node
var TreeTableFormat_TRs = ""; // Global variable for acumulating multiple times running function TreeTableFormat_TR

google.charts.load('current', {
	packages: ["orgchart"]
});

function CalculateCHAID(currentStep, direction) {
	var c, i, j, ct // counters for loops
	var too_many_cats
	var h // html text to be inserted
	var n_to_remove=0;
	var ncats; // number of categories
	if (currentStep == 2 && direction=="next") { // 1->2
		$('#step2_content').html('Loading...');
		dt = document.getElementById("Data").value; // get the content of the textarea
		dt = $('<div/>').text(dt).html(); // encode to avoid problems with html code inside the text
		dt = dt.replace(/\r\n/g, "\n").split("\n"); // transforming dt into array for each line
		n = dt.length;
		var sep = $('#separator :selected').text();
		if (sep == "[TAB]") sep = "\t";
		for (i = 0; i < n; i++) {
			if (dt[i] === ""){ // Empty line
				n_to_remove++;
				continue;
			}
			dt[i] = dt[i].split(sep); // transforming dt into a 2D matrix
		}
		n-=n_to_remove;
		cols = dt[0].length; // number of columns taken from first row
		if ($('#headings').prop('checked')) {
			dt_h = dt[0]; // headings
			dt.splice(0, 1);
			n--;
		} else {
			for (c = 0; c < cols; c++) {
				dt_h[c] = "col" + (c + 1); // headings
			}
		}
		// insert a check if matrix is full (all lines have the same num of columns)
		h = "<input type='text' id='pv_split_node' value='0.05' size='2' maxlength='12' style='text-align:right;font-size:14px;'/>";
		h += "<span style='font-size:18px; font-weight:bold'> p-value for splitting nodes</span><br />";
		h += "Significance level used for deciding to split a node based on the variable's discriminant power against the dependent variable. Larger p-values generate taller trees.<br /><br />";
		h += "<input type='text' id='pv_merge_cat' value='0.05' size='2' maxlength='12' style='text-align:right;font-size:14px;'/>";
		h += "<span style='font-size:18px; font-weight:bold'> p-value for merging categories</span><br />";
		h += "Significance level used for variables with more than 2 categories for deciding to merge two or more categories based on their similarity against the dependent variable. Larger p-values generate broader trees.<br /><br />";
		h += "<input type='text' id='min_terminal_node' value='20' size='2' maxlength='12' style='text-align:right;font-size:14px;'/>";
		h += "<span style='font-size:18px; font-weight:bold'> Minimum node size</span><br />";
		h += "If the splitting of a parent node would create a child node smaller than this, CHAID will try to merge it with the other most similar child node until the resulting merged child node is larger.<br /><br />";
		cat=[];
		for (c = 0; c < cols; c++) {
			cat.push([
				[dt[0][c]]
			]);
		}
		for (i = 1; i < n; i++) {
			for (c = 0; c < cols; c++) {
				for (ct = 0; ct < cat[c].length; ct++) {
					if (dt[i][c] == cat[c][ct]) break;
				}
				if (ct == cat[c].length) cat[c].push(dt[i][c]);
			}
		}
		for (c = 0; c < cols; c++) {
			cat[c] = cat[c].sort();
		}
		if ($('#dep_var').find('option:selected').val() == 'first') {
			col_dep = 0;
			col_ind_i = 1;
			col_ind_f = cols - 1;
		} else {
			col_dep = cols - 1;
			col_ind_i = 0;
			col_ind_f = cols - 2;
		}
		h += "<h2>Dependent variable:</h2><h2>" + dt_h[col_dep] + "</h2>";
		ncats = cat[col_dep].length;
		if (ncats > 20 || ncats > n * 0.8) {
			h+="Too many categories to be used in CHAID.";
			// Add better mesage and hide Next btn
		}
		else {
			h+=ncats + " categories:";
				for (ct = 0; ct < ncats; ct++) {
					h += " '" + cat[col_dep][ct] + "'";
				}
		}
		h += "<br /><br /><table border='1' cellspacing='0' cellpadding='5'>";
		h += "<tr><td align='center' bgcolor='#EEEEEE'><h2>Use</h2></td>";
		h+="<td bgcolor='#EEEEEE'><h2>Variables</h2>";
		for (c = col_ind_i; c <= col_ind_f; c++) {
			if (cat[c].length>2){
				h+="<input id='all_cat_order' onclick='MarkAllOrdered()' type='checkbox'/><span style='font-size:12px;'>Mark all as Ordered</span>";
				break;
			}
		}
		h+="</td></tr>";
		for (c = col_ind_i; c <= col_ind_f; c++) {
			ncats = cat[c].length;
			if (ncats > 20 || ncats > n * 0.8) too_many_cats = true;
			else too_many_cats = false;
			if (too_many_cats) h += "<tr><td align='center' valign='middle'><input id='cat_ck_" + c + "' type='checkbox' disabled='disabled' /></td>"
			else h += "<tr><td align='center' valign='middle'><input id='cat_ck_" + c + "' type='checkbox' checked='checked' /></td>"
			if (too_many_cats) h += "<td style='color:#666'><h2>" + dt_h[c] + "</h2>Too many categories to be used in CHAID.<br /></td></tr>"
			else {
				h += "<td><h2>" + dt_h[c] + "</h2>" + ncats + " categories:"
				for (ct = 0; ct < ncats; ct++) {
					h += " '" + cat[c][ct] + "'";
				}
				if (ncats > 2) {
					h += "<br /><input id='cat_order_ck_" + c + "' class='cat_order_ck' onclick='Cat_order_ck()' type='checkbox'/><span style='font-size:12px;'> Ordered (splitting will respect alphabetical order)</span>";
				}
				h += "</td></tr>";
			}
		}
		h += "</table>";
		$('#step2_content').html(h);
	} else if (currentStep == 3 && direction=="next") { // 2->3
		$('#step3_content_B').html('Loading...');
		var node;
		var dt_node = []; // subset of the full database for analysing the node to be split
		var vars_used = []; // vector indicating if variable (column) in dt is to be used as independent variable
		var n_node = n; // number of observations of subset of database for the node to be split
		var merged_cat; // 3D matrix of merged categories (after merging the similar categories, if more than 2)
		var cat_orig_length_node = []; // Array storring the number of categories before merging (for Bonferroni adjustment). Can be different in every node.
		var pairs = []; // 2D matrix: list of pairs from merged categories, identified by index. pairs[pair][2] is p-value for merging the pair. pairs[pair][3] is array w group size.
		var How_many_outcomes;
		var dt_pair_ct = []; // Contingency table for merging a pair
		var dt_split_ct = []; // Contingency table for splitting a node
		var merged_cat_n = []; // Size of the merged categories (to be used to compare with minimun node size)
		var split_pv = []; // vector with p-value for splitting the node by each variable
		var split_test_stat = []; // vector with test statistic for splitting the node by each variable
		tree = [];
		tree[0] = [];
		// Initiating vars_used 
		for (c = 0; c < cols; c++) { // for every variable
			if (c >= col_ind_i && c <= col_ind_f && $('#cat_ck_' + c).prop('checked')) vars_used[c] = true;
			else vars_used[c] = false;
		}
		h = "";
		for (node = 0; node < tree.length; node++) { // for every node
			h += "<span style='font-size: 13px;font-weight:bold;'>Node " + node + "</span><br>";
			split_pv = []; // initiating variable for iteration
			// initiating variable to store prediction of dependent variable in the node
			tree[node].prediction = [];
			for (ct = 0; ct < cat[col_dep].length; ct++) {
				tree[node].prediction[ct] = 0;
			}
			// create subset of data for the node
			dt_node = [];
			for (i = 0; i < n; i++) {
				for (node_temp = node; node_temp > 0; node_temp = tree[node_temp].parent_node) {
					if (!Is_in_array(dt[i][tree[node_temp].created_by_split_variable_num], tree[node_temp].merged_categories)) break;
				}
				if (node_temp === 0) {
					dt_node.push(dt[i]);
					for (ct = 0; ct < cat[col_dep].length; ct++) {
						if (dt[i][col_dep] == cat[col_dep][ct]) {
							tree[node].prediction[ct]++;
							break;
						}
					}
				}
			}
			n_node = dt_node.length;
			tree[node].size = n_node;
			merged_cat = [];
			merged_cat_n = [];
			for (c = 0; c < cols; c++) { // for every variable
				if (vars_used[c]) {
					h += "|&nbsp&nbsp&nbsp&nbsp<span style='font-weight:bold;'>" + dt_h[c] + "</span><br>";
					// populate merged_cat, puting the categories available for that node inside array. At first, merget_cat[c] is 2D.
					merged_cat[c] = [dt_node[0][c]];
					merged_cat_n[c] = [];
					for (i = 1; i < n_node; i++) {
						for (ct = 0; ct < merged_cat[c].length; ct++) {
							if (dt_node[i][c] == merged_cat[c][ct]) break;
						}
						if (ct == merged_cat[c].length) {
							merged_cat[c].push(dt_node[i][c]);
						}
					}
					merged_cat[c] = merged_cat[c].sort();
					// transforming merged_cat in 3D for merging categories into groups
					for (ct = 0; ct < merged_cat[c].length; ct++) {
						merged_cat[c][ct] = [merged_cat[c][ct]];
					}
					if (merged_cat[c].length == 1) continue; // There are only one category on the variable c for that node
					if (merged_cat[c].length > 2) {
						h += "|&nbsp&nbsp&nbsp&nbspSince " + dt_h[c] + " in node " + node + " have more than 2 categories, attempting to merge similar categories...<br>";
						cat_orig_length_node[c] = merged_cat[c].length; // To be used for Bonferroni adjustment
						for (;;) { // until there is no more merging
							// create initial pairs of categories
							pairs = [];
							if ($('#cat_order_ck_' + c).prop('checked')) {
								for (ct = 0; ct < merged_cat[c].length - 1; ct++) {
									pairs.push([ct, ct + 1]);
								}
							} else {
								for (ct = 0; ct < merged_cat[c].length; ct++) {
									for (ct2 = ct + 1; ct2 < merged_cat[c].length; ct2++) {
										pairs.push([ct, ct2]);
									}
								}
							}
							for (pair = 0; pair < pairs.length; pair++) { // for every pair
								// create contingency table with any of the categories in the pair or merged pair
								for (r = 0; r <= 1; r++) {
									dt_pair_ct[r] = [];
									for (d = 0; d < cat[col_dep].length; d++) {
										dt_pair_ct[r][d] = 0; // zeroing the contingency table
									}
								}
								for (i = 0; i < n_node; i++) {
									F: for (r = 0; r <= 1; r++) { // for every member of the pair
										for (j = 0; j < merged_cat[c][pairs[pair][r]].length; j++) { // checking if is in any category of the first member of the pair
											if (dt_node[i][c] == merged_cat[c][pairs[pair][r]][j]) {
												for (d = 0; d < cat[col_dep].length; d++) {
													if (dt_node[i][col_dep] == cat[col_dep][d]) {
														dt_pair_ct[r][d]++;
														break F;
													}
												}
											}
										}
									}
								}
								h += "|&nbsp&nbsp&nbsp&nbsp|&nbsp&nbsp&nbsp&nbspPair: " + pair + " | Members: "
								for (j = 0; j < merged_cat[c][pairs[pair][0]].length; j++)
									h += "'" + merged_cat[c][pairs[pair][0]][j] + "' ";
								h += " x ";
								for (j = 0; j < merged_cat[c][pairs[pair][1]].length; j++)
									h += "'" + merged_cat[c][pairs[pair][1]][j] + "' ";
								// Calculates p-value for merging categories
								// Reducing contingency table to show only existing states of dependent variable
								How_many_outcomes = cat[col_dep].length;
								for (d = 0; d < dt_pair_ct[0].length;) {
									if ((dt_pair_ct[0][d] + dt_pair_ct[1][d]) === 0) {
										dt_pair_ct[0].splice(d, 1);
										dt_pair_ct[1].splice(d, 1);
										How_many_outcomes--;
									} else d++;
								}
								if (How_many_outcomes == 1) {
									pairs[pair][2] = 1
								} else {
									pairs[pair][2] = 1 - pchisq(test_statistic(dt_pair_ct), (dt_pair_ct.length - 1) * (dt_pair_ct[0].length - 1));
								}
								h += "| p-value: " + pairs[pair][2] + "<br>";
								// Saving group size
								pairs[pair][3] = [];
								for (r = 0; r <= 1; r++) {
									pairs[pair][3][r] = 0;
									for (d = 0; d < cat[col_dep].length; d++) {
										pairs[pair][3][r] += dt_pair_ct[r][d];
									}
								}
							}
							// Choosing highest p-value for merging
							pair_highest_pv = 0;
							pair_highest_pv_pv = 0;
							for (pair = 0; pair < pairs.length; pair++) {
								if (pairs[pair][2] !== null && pairs[pair][2] > pair_highest_pv_pv) {
									pair_highest_pv = pair;
									pair_highest_pv_pv = pairs[pair][2];
								}
							}
							h += "|&nbsp&nbsp&nbsp&nbspHighest p-value: " + pair_highest_pv_pv + " in pair: " + pair_highest_pv + "<br>";
							// checking against parameter and renewing merged_cat
							if (pair_highest_pv_pv > $("#pv_merge_cat").val()) {
								// merging the first member of the best pair with the second member of the same pair
								merged_cat[c][pairs[pair_highest_pv][0]] = merged_cat[c][pairs[pair_highest_pv][0]].concat(merged_cat[c][pairs[pair_highest_pv][1]]);
								// deleting the second member
								merged_cat[c].splice(pairs[pair_highest_pv][1], 1);
								if (merged_cat[c].length == 2) {
									h += "|&nbsp&nbsp&nbsp&nbspMerging categories stopped because resulted in only 2 merged categories<br>";
									break;
								}
							} else {
								// Continue to merge small groups to avoid creating nodes that are smaller than the minimum node size

								// Mudar a ordem... primeiro resolver os grupos pequenos e depois merge usando p-valor. Acho que vai gerar resultado melhor...

								small_pair_highest_pv_pv = 0;
								small_groups_exists = false;
								for (pair = 0; pair < pairs.length; pair++) {
									if (pairs[pair][2] !== null && pairs[pair][2] > small_pair_highest_pv_pv && (pairs[pair][3][0] < $("#min_terminal_node").val() || pairs[pair][3][1] < $("#min_terminal_node").val())) {
										small_groups_exists = true;
										small_pair_highest_pv = pair;
										small_pair_highest_pv_pv = pairs[pair][2];
									}
								}
								if (small_groups_exists) {
									h += "|&nbsp&nbsp&nbsp&nbspMerging categories to avoid creating nodes that are smaller than the minimum node size.<br>";
									// merging the first member of the best pair with the second member of the same pair
									merged_cat[c][pairs[small_pair_highest_pv][0]] = merged_cat[c][pairs[small_pair_highest_pv][0]].concat(merged_cat[c][pairs[small_pair_highest_pv][1]]);
									// deleting the second member
									merged_cat[c].splice(pairs[small_pair_highest_pv][1], 1);
									if (merged_cat[c].length == 2) {
										h += "|&nbsp&nbsp&nbsp&nbspMerging categories stopped because resulted in only 2 merged categories<br>";
										break;
									}
								} else {
									h += "|&nbsp&nbsp&nbsp&nbspMerging categories stopped because the resulting merged categories are not too similar.<br>";
									break;
								}
							}
						}
					}
					// End Merging
					// Begin Splitting
					// create contingency table with any of the categories in the merged pair
					dt_split_ct = [];
					for (r = 0; r < merged_cat[c].length; r++) {
						dt_split_ct[r] = [];
						for (d = 0; d < cat[col_dep].length; d++) {
							dt_split_ct[r][d] = 0; // zeroing the contingency table
						}
					}
					for (i = 0; i < n_node; i++) { // for every observation
						G: for (r = 0; r < merged_cat[c].length; r++) { // for every merged category
							for (j = 0; j < merged_cat[c][r].length; j++) { // for every member of merged category
								if (dt_node[i][c] == merged_cat[c][r][j]) {
									for (d = 0; d < cat[col_dep].length; d++) {
										if (dt_node[i][col_dep] == cat[col_dep][d]) {
											dt_split_ct[r][d]++;
											break G;
										}
									}
								}
							}
						}
					}
					// writing contingency table for info.
					h += "|&nbsp&nbsp&nbsp&nbspContingency table:<br><table border=1><tr><td>&nbsp</td>";
					for (d = 0; d < cat[col_dep].length; d++) { // for every state of dependent variable
						h += "<td>" + cat[col_dep][d] + "</td>"
					}
					h += "</tr>";
					for (r = 0; r < merged_cat[c].length; r++) { // for every merged category
						h += "<tr><td>" + merged_cat[c][r].join(', ') + "</td>"
						merged_cat_n[c][r] = 0;
						for (d = 0; d < cat[col_dep].length; d++) { // for every state of dependent variable
							h += "<td>" + dt_split_ct[r][d] + "</td>"
							merged_cat_n[c][r] += dt_split_ct[r][d];
						}
						h += "</tr>"
					}
					h += "</table>"
						// Reducing contingency table to show only existing states of dependent variable
					for (d = 0; d < dt_split_ct[0].length;) {
						sum_d = 0;
						for (r = 0; r < merged_cat[c].length; r++) sum_d += dt_split_ct[r][d];
						if (sum_d === 0) {
							for (r = 0; r < merged_cat[c].length; r++) dt_split_ct[r].splice(d, 1);
						} else d++;
					}
					// Calculates p-value with Bonferroni adjustment for merging categories
					// Source is the same as IBM SPSS: Kass, G. 1980. An exploratory technique for investigating large quantities of categorical data. Applied Statistics, 29:2, 119-127.
					split_test_stat[c] = test_statistic(dt_split_ct)
					split_pv[c] = 1 - pchisq(split_test_stat[c], (dt_split_ct.length - 1) * (dt_split_ct[0].length - 1));
					h += "|&nbsp&nbsp&nbsp&nbspVar: " + dt_h[c] + " | test stat: " + split_test_stat[c] + " | p-value: " + split_pv[c] + "<br>";
					if (cat_orig_length_node[c] > merged_cat[c].length) {
						split_pv[c] *= Bonferroni_adjustment(cat_orig_length_node[c], merged_cat[c].length,$('#cat_order_ck_' + c).prop('checked'));
						h += "|&nbsp&nbsp&nbsp&nbspp-value with Bonferroni adjustment: " + split_pv[c] + "<br>";
					}
					h += "<br>";
				}
			}
			// Choosing lowest p-value for splitting
			var_lowest_pv = 0;
			var_lowest_pv_pv = 1;
			var_lowest_pv_test_stat = 0;
			for (c = 0; c < cols; c++) { // for every variable
				if (vars_used[c]) {
					if (split_pv[c] !== null && merged_cat[c].length > 1 && Math.min.apply(Math, merged_cat_n[c]) >= $("#min_terminal_node").val()) {
						// If: Exists p-value, there are more than 1 group to be split and all created nodes would be big enough
						if (split_pv[c] < var_lowest_pv_pv || (split_pv[c] == var_lowest_pv_pv && split_test_stat[c] > var_lowest_pv_test_stat)) {
							// 2nd situation could happen if p-value rounds to 0 in more than one variable: pick the largest test-statistic
							var_lowest_pv = c;
							var_lowest_pv_pv = split_pv[c];
							var_lowest_pv_test_stat = split_test_stat[c];
						}
					}
				}
			}
			if (var_lowest_pv_pv == 1) {
				h += "|&nbsp&nbsp&nbsp&nbspNode " + node + " cannot be split because all variables are the same or because splitting would generate groups smaller than the minimum node size.<br>";
			} else if (var_lowest_pv_pv < $("#pv_split_node").val()) {
				// Splitting
				// Update info to variable tree in the previous node
				tree[node].split_variable_num = var_lowest_pv;
				tree[node].split_variable_name = dt_h[var_lowest_pv];
				tree[node].split_pv = split_pv[var_lowest_pv];
				// Add more statistics here
				// Create new nodes for every category group of the lowest p-value variable
				for (r = 0; r < merged_cat[var_lowest_pv].length; r++) {




					// colocar que é nó terminal se for homogêneo!! E não tentar split nele




					tree.push({
						parent_node: node,
						created_by_split_variable_num: var_lowest_pv,
						merged_categories: merged_cat[var_lowest_pv][r]
					});
					h += "|&nbsp&nbsp&nbsp&nbspNew node when <b>" +tree[node].split_variable_name +"</b> in (" + merged_cat[var_lowest_pv][r].join(', ') + "). <br>";
				}
			} else {
				h += "|&nbsp&nbspNode " + node + " cannot be split because variables do not disciminate enough.<br>";




				// definir como nó terminal!!!!




			}
			h += "<br>";
		}
		google.charts.setOnLoadCallback(drawChart(document.getElementById('step3_content_A')));













		// See tree in table format
		for (node = 0; node < tree.length; node++) {
			tree[node].level = 0;
			for (node_temp = node; node_temp > 0; node_temp = tree[node_temp].parent_node) {
				tree[node].level++;
			}

		}
		var h2;
		h2 = "<table border='1'><tr><td>[0] root</td></tr>";
		TreeTableFormat_TRs="";
		TreeTableFormat_TR(tree, 0);
		h2 += TreeTableFormat_TRs;
		h2 += "</tr></table>";
		$('#step3_content_B').html(h2);
		$('#step3_content_C').html(h);
	}
}

function Is_in_array(needle, haystack) {
	var hn = haystack.length;
	for (i = 0; i < hn; i++) {
		if (needle == haystack[i]) return true;
	}
	return false;
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

function Bonferroni_adjustment(c, r, ordered) {
	// c: number of categories before reduction
	// r: number of groups after reduction
	// ordered (true or false / undefined)
	var B = 0; // Bonferroni adjustment
	if (ordered) {
		B = Binomial_coefficient(c - 1, r - 1);
	} else {
		for (i = 0; i < r; i++) {
			B += Math.pow(-1, i) * Math.pow(r - i, c) / (Fact(i) * Fact(r - i));
		}
	}
	return B;
}

function Binomial_coefficient(m, k) {
	if (m < 0 || k < 0 || k > m) {
		console.log('Error in arguments of binomial coefficient')
		return;
	}
	if (m < 171) return Math.floor(0.5 + Fact(m) / (Fact(k) * Fact(m - k)));
	return Math.floor(0.5 + Math.exp(Factln(m) - Factln(k) - Factln(m - k)));
}

function Fact(num) {
	if (num > 171) {
		console.log('Factorial operation out of range')
		return;
	}
	var rval = 1;
	for (var i = 2; i <= num; i++) rval = rval * i;
	return rval;
}

function Factln(num) {
	// returns ln(n!)
	if (num < 0) {
		console.log('Error: Negative argument in Factln');
		return;
	}
	var NTOP = 2000;
	var init = true;
	var a = [];
	if (init) {
		init = false;
		for (var i = 0; i < NTOP; i++) a.push(gammln(i + 1));
	}
	if (n < NTOP) return a[num];
	return gammln(num + 1); // Out of range of table
}

function gammln(xx) {
	if (xx <= 0) {
		console.log('Error calculating GAMMLN. Argument must be positive.');
		return;
	}
	var x, tmp, y, ser, cof;
	cof = [57.1562356658629235, -59.5979603554754912, 14.1360979747417471, -0.491913816097620199, 0.339946499848118887e-4, 0.465236289270485756e-4, -0.983744753048795646e-4, 0.158088703224912494e-3, -0.210264441724104883e-3, 0.217439618115212643e-3, -0.164318106536763890e-3, 0.844182239838527433e-4, -0.261908384015814087e-4, 0.368991826595316234e-5];
	y = x = xx;
	tmp = x + 5.2421875; // Rational 671/128
	tmp = (x + 0.5) * Math.log(tmp) - tmp;
	ser = 0.999999999999997092;
	for (var j = 0; j < 14; j++) ser += cof[j] / ++y;
	return (tmp + Math.log(2.5066282746310005 * ser / x));
}

function drawChart(TargetDiv) {
	var data = new google.visualization.DataTable();
	data.addColumn('string', 'Name');
	data.addColumn('string', 'Manager');
	data.addColumn('string', 'ToolTip');

	// For each orgchart box, provide the name, manager, and tooltip to show.
	var html_text_for_node = '';
	for (var node = 0; node < tree.length; node++) {
		if (node !== 0) {
			html_text_for_node = tree[node].merged_categories.join(', ') + '<br>';
		}
		html_text_for_node += "<b><span style='font-size: 14px;display: inline-block;white-space:nowrap;'>Node " + node + "</span></b><br>";
		html_text_for_node += "<table width='100%' border='1' cellspacing='0' cellpadding='2' style='border-collapse: collapse;'>";
		for (ct = 0; ct < tree[node].prediction.length; ct++) {
			html_text_for_node += '<tr><td align="left">' + cat[col_dep][ct] + '</td><td align="right">' + tree[node].prediction[ct] + '</td><td align="right">' + Math.round(tree[node].prediction[ct]/tree[node].size*1000)/10 + '&#37;</td></tr>';
		}
		html_text_for_node += '</table>';
		if (tree[node].split_variable_name) {
			html_text_for_node += tree[node].split_variable_name + '<br>p-value: ' + (Math.round(tree[node].split_pv * 10000) / 10000).toFixed(4);
		}
		data.addRows([
			[{
				v: node.toString(),
				f: html_text_for_node
			}, node === 0 ? '' : tree[node].parent_node.toString(), '']
		]);
	}
	// Create the chart.
	var chart = new google.visualization.OrgChart(TargetDiv);
	var size = 'medium';
	if (tree.length > 11) size = 'small';
	chart.draw(data, {
		allowHtml: true,
		size: size,
		nodeClass: 'nodeClass',
		selectedNodeClass: 'nodeClassSel'
	});
}

function Tree_in_new_window(){
	var OpenWindow = window.open("JustTree.html","_blank","width=700,height=550,resizable=yes",true);
	OpenWindow.tree=tree;
	OpenWindow.cat=cat;
	OpenWindow.col_dep=col_dep;
}

function TreeTableFormat_TR(treeB, ParentNode) {
	for (var node = 1; node < treeB.length; node++) {
		if (treeB[node].parent_node == ParentNode) {
			TreeTableFormat_TRs += "<tr><td>"
			for (var i = 0; i < treeB[node].level; i++) TreeTableFormat_TRs += "|&nbsp&nbsp&nbsp&nbsp";
			TreeTableFormat_TRs += "[" + node + "] ";
			if (node === 0) TreeTableFormat_TRs += "root";
			else {
				TreeTableFormat_TRs += dt_h[treeB[node].created_by_split_variable_num] + " in (" + tree[node].merged_categories.join(', ') + ")";
			}
			TreeTableFormat_TRs += "</td></tr>";
			TreeTableFormat_TR(treeB, node);
		}
	}
}