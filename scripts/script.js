function getRecords(request, callback) {
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    // const proxyurl = ""
    var targeturl = "https://dione.batstate-u.edu.ph/public/sites/apps/student/ajax.php?" + request;
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
    <caption><span class="tag is-info"><b>` + year + `</b>&nbsp;&nbsp;` + sem + `</span></caption>
      <tr>
        <th>Course code</th>
        <th>Description</th>
        <th>Credits</th>
        <th>Grade</th>
        <th>Instructor</th>
        <th>Status</th>
      </tr>
    `
    var totalUnits = 0,
        weightedSum = 0,
        gwa = 0;
    for (i = 0; i < data.length; i++) {
        var stats = "is-success"
        if (data[i].status === "FAILED") {
            stats = `is-danger`
        }
        head += `
        <tr>
            <td>` + data[i].subject_code + `</td>
            <td>` + data[i].subject_description + `</td>
            <td>` + data[i].subject_credits + `</td>
            <td>` + data[i].grade + `</td>
            <td>` + data[i].instructor_name + `</td>
            <td><span class="tag ` + stats + ` is-light">` + data[i].status + `</span></td>
          </tr>
        `
        totalUnits += data[i].subject_credits
        if (isNaN(data[i].grade)) {
            weightedSum += data[i].subject_credits * data[i].grade2
        } else {
            weightedSum += data[i].subject_credits * data[i].grade
        }
    }
    gwa = weightedSum / totalUnits
    gwa = gwa.toFixed(2);
    head += `</table><span class="tag is-warning">Total Units:&nbsp;<b>` + totalUnits + `</b></span>&nbsp;&nbsp;
    <span class="tag is-success">GWA:&nbsp;<b>` + gwa + `</b></span><br><hr>`
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
                    // console.log(gbs[g])
                    sem = g
                }
                sy = gy
            }
            $("#grades").html(tbl);
            $("#photo").attr('src', 'http://dione.batstate-u.edu.ph/public/sites/api/fetch_photo.php?srcode=' + srcode);
            var enrolment = getRecords("do=fetch_enrollment_records&schoolyear=" + sy + "&semester=" + sem + "&srcode=" + srcode, function(records) {
                $("#enrolment").html(enrolmentData(records[0]));
                // console.log(records[0])
                $("#loading").fadeOut('slow', function() {
                    $("#loading").removeClass('pageloader')
                    $("#loading").text('')
                    $("#loading").removeAttr('style')
                });
            })
        } else {
            $("#enrolment").text('')
            $("#grades").html('<span class="tag is-danger is-light">No record found!</span>')
            $("#loading").fadeOut('slow', function() {
                $("#loading").removeClass('pageloader')
                $("#loading").text('')
                $("#loading").removeAttr('style')
                $("#photo").removeAttr('src')
            });
        }
    });
}