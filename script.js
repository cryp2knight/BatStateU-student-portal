function getRecords(request, callback) {
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    var targeturl = "http://dione.batstate-u.edu.ph/public/sites/apps/student/ajax.php?" + request;
    var url = proxyurl + targeturl;
    $.ajax({
        url: url,
        type: "GET",
        success: function(response) {
            var enrolment = $.parseJSON(response);
            callback(enrolment)
        },
        error: function(xhr, status) {
            console.log(xhr);
        }
    });
}

function enrolmentData(data) {
    return `<table class="table is-striped is-hoverable"><tr><td>SR-Code:</td><td><b>` + data.srcode + `</b></td></tr>
    <tr><td>Name: </td><td><b>` + data.lastname + `, ` + data.firstname + ` ` + data.middlename + `</b></td></tr>
    <tr><td>Program: </td><td><b>` + data.coursename + `</b></td></tr>
    <tr><td>College: </td><td><b>` + data.collegecode + `</b></td></tr>
    <tr><td>Campus: </td><td><b>` + data.campus + `</b></td></tr>
    <tr><td>Year Level: </td><td><b>` + data.yearlevel + `</b></td></tr>
    <tr><td>Sex: </td><td><b>` + data.sex + `</b></td></tr>
    </table>
    `
}

function table(data, year, sem) {
    var head = `
    <table class="table is-hoverable is-fullwidth is-striped is-narrow is-bordered">
    <caption>` + year + `|` + sem + `</caption>
      <tr>
        <th>Course code</th>
        <th>Description</th>
        <th>Credits</th>
        <th>Grade</th>
        <th>Instructor</th>
        <th>status</th>
      </tr>
    `
    var totalUnits = 0,
        weightedSum = 0,
        gwa = 0;
    for (i = 0; i < data.length; i++) {
        head += `
        <tr>
            <td>` + data[i].subject_code + `</td>
            <td>` + data[i].subject_description + `</td>
            <td>` + data[i].subject_credits + `</td>
            <td>` + data[i].grade_final + `</td>
            <td>` + data[i].instructor_name + `</td>
            <td>` + data[i].status + `</td>
          </tr>
        `
        totalUnits += data[i].subject_credits
        weightedSum += data[i].subject_credits * data[i].grade_final
    }
    gwa = weightedSum / totalUnits
    gwa = gwa.toFixed(2);
    head += `</table>Total Units: <b>` + totalUnits + `</b>&nbsp;&nbsp;&nbsp;GWA: <b>` + gwa + `</b><br><br>`
    return head
}
$(document).ready(function($) {
    $("#getrecords").click(function(event) {
        retrieve()
    });
    $('#srcode').on('keypress', function(event) {
        if (event.which === 13) {
            retrieve();
        }
    });
});

function retrieve() {
    $("#loading").addClass('pageloader');
    $("#loading").text('Loading...')
    var srcode = $("#srcode").val();
    var sy = "",
        sem = ""
    var grades = getRecords("do=fetch_grades&srcode=" + srcode, function(records) {
        if (records.length > 0) {
            var groupBy = function(xs, key) {
                return xs.reduce(function(rv, x) {
                    (rv[x[key]] = rv[x[key]] || []).push(x);
                    return rv;
                }, {});
            };
            var groupedByYear = groupBy(records, 'schoolyear')
            var tbl = ""
            for (gy in groupedByYear) {
                var gbs = groupBy(groupedByYear[gy], 'semester')
                for (g in gbs) {
                    tbl += table(gbs[g], gy, g)
                    console.log(gbs[g])
                    sem = g
                }
                sy = gy
            }
            $("#grades").html(tbl);
            $("#photo").attr('src', 'http://dione.batstate-u.edu.ph/public/sites/api/fetch_photo.php?srcode=' + srcode);
            var enrolment = getRecords("do=fetch_enrollment_records&schoolyear=" + sy + "&semester=" + sem + "&srcode=" + srcode, function(records) {
                $("#enrolment").html(enrolmentData(records[0]));
                console.log(records[0])
                $("#loading").fadeOut('slow', function() {
                    $("#loading").removeClass('pageloader')
                    $("#loading").text('')
                    $("#loading").removeAttr('style')
                });
            })
        } else {
            $("#enrolment").text('No data found!')
            $("#grades").text('')
            $("#loading").fadeOut('slow', function() {
                $("#loading").removeClass('pageloader')
                $("#loading").text('')
                $("#loading").removeAttr('style')
                $("#photo").removeAttr('src')
            });
        }
    });
}