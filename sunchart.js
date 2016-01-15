var margin = {left: 40, top: 30, right: 40, bottom: 30};
var width = 960 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var hour_format = d3.time.format('%H%M');
var date_format = d3.time.format('%e %b');

var x = d3.time.scale().range([0, width]);
var y = d3.time.scale().range([height, 0]);
var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');
var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .tickFormat(d3.time.format.multi([
        ['%H%M', function (d) { return d.getHours(); }]
    ]));
var yAxisRight = d3.svg.axis()
    .scale(y)
    .orient('right')
    .tickFormat(d3.time.format.multi([
        ['%H%M', function (d) { return d.getHours(); }]
    ]));
        
var svg = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var sunset = d3.svg.area()
    .x(function (d) { return x(d.date); })
    .y0(0)
    .y1(function (d) { return y(d.sunset); });

var sunrise = d3.svg.area()
    .x(function (d) { return x(d.date); })
    .y0(height)
    .y1(function (d) { return y(d.sunrise); });

var lighting_down = d3.svg.area()
    .x(function (d) { return x(d.date); })
    .y0(height)
    .y1(function (d) { return y(add_minutes(d.sunrise, -30)); });

var lighting_up = d3.svg.area()
    .x(function (d) { return x(d.date); })
    .y0(0)
    .y1(function (d) { return y(add_minutes(d.sunset, 30)); });

var midday = d3.svg.line()
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(new Date((d.sunrise.getTime() + d.sunset.getTime()) / 2)); });

function read_row(row) {
    var time_format = d3.time.format('%H:%M');
    var date = new Date(+row.Year, +row.Month-1, +row.Day);
    var data = {
        date: date,
        sunrise: time_format.parse(row.Sunrise),
        sunset: time_format.parse(row.Sunset)
    };

    return data;
}

function add_minutes(date, minutes) {
    var result = new Date(date);
    // Won't work across daylight savings time but we aren't
    // spanning that at any point.
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}

function time_of_day(hour, minute) {
    // To match D3's default parse date.
    var result = new Date(0, 0, 1);
    result.setHours(hour);
    if (typeof(minute) !== 'undefined') {
        result.setMinutes(minute);
    }

    return result;
}

function round_date(date) {
    if (date.getHours() >= 12) {
        // Will work even at the end of the month.
        date.setDate(date.getDate() + 1);
    }

    date.setHours(0, 0, 0, 0);
    return date;
}

function find_index(date, dates) {
    var i = 0;
    for (i = 0; i < dates.length; i += 1) {
        if (dates[i].date.getTime() === date.getTime()) {
            return i;
        }
    }

    return -1;
}

d3.csv('suntimes.txt', read_row, function (error, data) {
    var overlay, overlay_bar, overlay_sunrise, overlay_sunset, overlay_text;

    if (error) {
        throw error;
    }

    x.domain(d3.extent(data, function (d) { return d.date; }));
    y.domain([time_of_day(5, 0), time_of_day(19, 0)]);
    y.ticks(d3.time.hour, 1);

    svg.append('path')
       .datum(data)
       .attr('class', 'twilight')
       .attr('d', sunset);

    svg.append('path')
       .datum(data)
       .attr('class', 'fulldark')
       .attr('d', lighting_up);

    svg.append('path')
       .datum(data)
       .attr('class', 'twilight')
       .attr('d', sunrise);

    svg.append('path')
       .datum(data)
       .attr('class', 'fulldark')
       .attr('d', lighting_down);

    var solstice = data[58]; // nasty manual lookup.
    svg.append('line')
       .attr('class', 'solstice')
       .attr('x1', x(solstice.date))
       .attr('y1', y(solstice.sunrise))
       .attr('x2', x(solstice.date))
       .attr('y2', y(solstice.sunset));

    // I need to understand SVG transforms better ...
    svg.append('text')
       .attr('transform', 'translate(' + (x(solstice.date) + 5) + ',' + (y(solstice.sunset) + 5) + ') rotate(-90)')
       .attr('dy', '.71em')
       .style('text-anchor', 'end')
       .text('Winter Solstice');

    svg.append('line')
       .attr('class', 'noon')
       .attr('x1', 0)
       .attr('y1', y(time_of_day(12, 0)))
       .attr('x2', width)
       .attr('y2', y(time_of_day(12, 0)));

    svg.append('path')
       .datum(data)
       .attr('class', 'midday')
       .attr('d', midday);

    svg.append('text')
       .text('Middle of day')
       .attr('class', 'midday')
       .attr('y', y(time_of_day(11, 40)))
       .attr('x', 5)
       .attr('dy', '0.71em');
       
    svg.append('rect')
       .attr('x', 0)
       .attr('width', width)
       .attr('y', y(time_of_day(8, 30)))
       .attr('height', y(time_of_day(7, 30)) - y(time_of_day(8, 30)))
       .attr('class', 'commute');

    svg.append('text')
       .text('Commute')
       .attr('class', 'commute_label')
       .attr('x', 5)
       .attr('y', y(time_of_day(8, 35)));

    svg.append('rect')
       .attr('x', 0)
       .attr('width', width)
       .attr('y', y(time_of_day(18, 0)))
       .attr('height', y(time_of_day(17, 0)) - y(time_of_day(18, 0)))
       .attr('class', 'commute');

    svg.append('text')
       .text('Commute')
       .attr('class', 'commute_label')
       .attr('x', width - 5)
       .attr('y', y(time_of_day(16, 40)))
       .style('text-anchor', 'end');

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + width + ',0)')
        .call(yAxisRight);

    svg.append('rect')
       .attr('x', 0)
       .attr('width', width)
       .attr('y', 0)
       .attr('height', height)
       .attr('class', 'layer');

    overlay = svg.append('g')
                 .attr('class', 'overlay')
                 .style('display', 'none');

    overlay_bar = overlay.append('line')
     .attr('class', 'solstice')
     .attr('x1', 0)
     .attr('y1', y(solstice.sunrise))
     .attr('x2', 0)
     .attr('y2', y(solstice.sunset));

    overlay_text = overlay.append('text')
       .attr('transform', 'translate(5, ' + (height/2 - 5) + ') rotate(-90)')
       .attr('dy', '.71em')
       .style('text-anchor', 'start')
       .text('');

    overlay_sunset = overlay.append('text')
      .attr('x', 5)
      .text('');

    overlay_sunrise = overlay.append('text')
      .attr('x', 5)
      .text('');

    function on_mouse_move() {
        var mouse_x = d3.mouse(this)[0],
            date = round_date(x.invert(mouse_x)),
            position = x(round_date(date)),
            index = find_index(date, data);
        
        overlay.attr('transform', 'translate(' + position + ',0)');
        if (index !== -1) {
            overlay.style('display', '');
            overlay_bar.attr('y1', y(data[index].sunrise));
            overlay_bar.attr('y2', y(data[index].sunset));
            overlay_text.text(date_format(date));

            overlay_sunset.attr('y', y(data[index].sunset) + 10)
                          .text(hour_format(data[index].sunset));

            overlay_sunrise.attr('y', y(data[index].sunrise) - 5)
                           .text(hour_format(data[index].sunrise));
        } else {
            overlay.style('display', 'none');
        }
    }

    svg.on('mouseover', function () { overlay.style('display', ''); })
       .on('mouseout', function () { overlay.style('display', 'none'); })
       .on('mousemove', on_mouse_move);
});
