// barchartrace.js
const margin = { top: 60, right: 30, bottom: 50, left: 250 };
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const barHeight = 45;  // Fixed bar height
const logoSize = 40;  // Size of the logos
const maxBars = Math.floor(height / barHeight);  // Maximum number of bars that fit in the height

const svg = d3.select("#chart").append("svg")
    .attr("width", 960)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.1);

const xAxis = d3.axisBottom(x).tickFormat(d => d3.format(".2s")(d).replace("G", "B"));

const gX = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`);

svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.bottom - 10)
    .text("Impact MA to 0 on SCR (in Millions)");

// Add dynamic year text
const yearLabel = svg.append("text")
    .attr("class", "year")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle");

d3.csv("https://raw.githubusercontent.com/munkiepus/mabenefit/main/flatdata.csv").then(data => {
    data.forEach(d => {
        d["Impact MA to 0 on SCR"] = +d["Impact MA to 0 on SCR"];
        d["Year"] = +d["Year"];
    });

    const nestedData = d3.groups(data, d => d.Year)
        .map(([year, values]) => ({
            year: year,
            values: values.sort((a, b) => b["Impact MA to 0 on SCR"] - a["Impact MA to 0 on SCR"]).slice(0, maxBars)
        }));

    const update = (data) => {
        x.domain([0, d3.max(data.values, d => d["Impact MA to 0 on SCR"])]);
        y.domain(data.values.map(d => d["Firm Short"])).range([0, data.values.length * barHeight]);

        gX.transition().duration(750).call(xAxis);

        const bars = svg.selectAll(".bar")
            .data(data.values, d => d["Firm Short"]);

        bars.exit().remove();

        const barsEnter = bars.enter().append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(0, ${y(d["Firm Short"])})`);

        barsEnter.append("rect")
            .attr("x", logoSize + 5)  // Offset to make room for the logo
            .attr("width", d => x(d["Impact MA to 0 on SCR"]))
            .attr("height", barHeight - 5)
            .attr("fill", d => d["Colour"]);

        barsEnter.append("image")
            .attr("xlink:href", d => `https://raw.githubusercontent.com/munkiepus/mabenefit/main/icons/${d["Firm Short"]}.png`)
            .attr("x", 0)  // Position the logo at the start
            .attr("y", (barHeight - logoSize) / 2)
            .attr("width", logoSize)
            .attr("height", logoSize);

        barsEnter.append("text")
            .attr("x", d => x(d["Impact MA to 0 on SCR"]) + logoSize + 10)  // Position text after the bar and logo
            .attr("y", (barHeight - 5) / 2)
            .attr("dy", ".35em")
            .text(d => `${d3.format(",.1f")(d["Impact MA to 0 on SCR"] / 1e6)}M`);

        const barsUpdate = barsEnter.merge(bars);

        barsUpdate.transition().duration(750)
            .attr("transform", d => `translate(0, ${y(d["Firm Short"])})`);

        barsUpdate.select("rect")
            .transition().duration(750)
            .attr("width", d => x(d["Impact MA to 0 on SCR"]));

        barsUpdate.select("text")
            .transition().duration(750)
            .attr("x", d => x(d["Impact MA to 0 on SCR"]) + logoSize + 10);

        // Update the year label
        yearLabel.transition().duration(750).text(data.year);
    };

    let index = 0;
    const timer = d3.interval(() => {
        update(nestedData[index]);
        index = (index + 1) % nestedData.length;
    }, 2000);
});
