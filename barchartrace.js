// barchartrace.js
const margin = { top: 70, right: 150, bottom: 120, left: 150 };
const fullWidth = 1200;
const width = fullWidth - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const barHeight = 45;
const logoSize = 40;
const maxBars = Math.floor(height / barHeight);

const chartDiv = d3.select("#chart");

const svg = chartDiv.append("svg")
    .attr("width", fullWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.1);

const xAxis = d3.axisBottom(x)
    .tickFormat(d => d3.format(".2s")(d).replace("G", "B"))
    .tickSizeOuter(0)
    .tickPadding(15);

const gX = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .style("color", "white")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .call(xAxis);

const xAxisLabel = svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 40)
    .style("fill", "white")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("text-shadow", "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black")
    .text("MA impact on SCR");

const yearLabel = svg.append("text")
    .attr("class", "year")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("text-shadow", "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black");

d3.csv("https://raw.githubusercontent.com/munkiepus/mabenefit/main/flatdata.csv").then(data => {
    data.forEach(d => {
        d["Impact MA to 0 on SCR"] = +d["Impact MA to 0 on SCR"];
        d["Year"] = +d["Year"];
        d["Month"] = d["Month"] ? d["Month"].padStart(2, '0') : '01';  // Assuming default month to '01' if not provided
        d.date = new Date(d.Year, d.Month - 1);  // Create a date object
    });

    const maxImpactValue = d3.max(data, d => d["Impact MA to 0 on SCR"]) * 1.1;

    const nestedData = d3.groups(data, d => `${d.Year}-${d.Month}`)
        .map(([yearMonth, values]) => ({
            yearMonth: values[0].date,
            values: values.sort((a, b) => b["Impact MA to 0 on SCR"] - a["Impact MA to 0 on SCR"]).slice(0, maxBars)
        }))
        .sort((a, b) => a.yearMonth - b.yearMonth);

    x.domain([0, maxImpactValue]);

    let index = 0;
    let timer;

    const update = (data) => {
        y.domain(data.values.map(d => d["Firm Short"])).range([0, data.values.length * barHeight]);

        gX.transition()
            .duration(500)
            .ease(d3.easeCubic)
            .call(xAxis);

        const bars = svg.selectAll(".bar")
            .data(data.values, d => d["Firm Short"]);

        bars.exit().remove();

        const barsEnter = bars.enter().append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(0, ${y(d["Firm Short"])})`);

        barsEnter.append("rect")
            .attr("x", logoSize + 5)
            .attr("width", 0)
            .attr("height", barHeight - 5)
            .style("stroke", "white")
            .style("stroke-width", "1px");

        barsEnter.append("image")
            .attr("xlink:href", d => `https://raw.githubusercontent.com/munkiepus/mabenefit/main/icons/${d["Firm Short"]}.png`)
            .attr("x", 0)
            .attr("y", (barHeight - logoSize) / 2)
            .attr("width", logoSize)
            .attr("height", logoSize);

        barsEnter.append("text")
            .attr("class", "value-label")
            .attr("x", logoSize + 75)
            .attr("y", (barHeight - 5) / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "white")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("text-shadow", "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black");

        const barsUpdate = barsEnter.merge(bars);

        barsUpdate.transition()
            .duration(500)
            .ease(d3.easeCubic)
            .attr("transform", d => `translate(0, ${y(d["Firm Short"])})`);

        barsUpdate.select("rect")
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .attr("width", d => x(d["Impact MA to 0 on SCR"]))
            .style("fill", d => d.Colour);

        barsUpdate.select(".value-label")
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .attr("x", d => x(d["Impact MA to 0 on SCR"]) + logoSize + 75)
            .text(d => `${d3.format(",.1f")(d["Impact MA to 0 on SCR"] / 1e6)}M`);

        yearLabel.transition()
            .duration(500)
            .ease(d3.easeCubic)
            .text(`${data.yearMonth.getFullYear()}`);
    };

    const startAnimation = () => {
        index = 0;
        timer = d3.interval(() => {
            update(nestedData[index]);
            index++;
            if (index === nestedData.length) {
                timer.stop();
            }
        }, 300);
    };

    // Initial update to start the animation at the earliest year
    update(nestedData[0]);

    // Start animation 3 seconds after page load
    setTimeout(() => {
        startAnimation();
    }, 3000);
});
