// barchartrace.js
const margin = { top: 70, right: 150, bottom: 120, left: 150 };
const fullWidth = 1200;  // Set full width to 1000
const fullHeight = 1000;  // Set full height to 1000
const width = fullWidth - margin.left - margin.right;
const height = fullHeight - margin.top - margin.bottom;

const chartDiv = d3.select("#chart");

const svg = chartDiv.append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.1); // Set padding to 10% of bar height

const xAxis = d3.axisBottom(x)
    .tickFormat(d => `£${d3.format(".2s")(d).replace("G", "B").replace(".0", "")}`)
    .tickSizeOuter(0)
    .tickPadding(15);

const gX = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .style("color", "white")
    .style("font-size", "24px")  // Update font size to 24px for x-axis scale
    .style("font-weight", "bold")
    .call(xAxis);

const xAxisLabel = svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 40)
    .style("fill", "white")
    .style("font-size", "24px")  // Font size for x-axis label
    .style("font-weight", "bold")
    .style("text-shadow", "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black")
    .text("Impact on SCR of setting MA to zero (R0090)"); // Updated x-axis title

const yearLabel = svg.append("text")
    .attr("class", "year")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "42px") // Set the font size to 42px
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
            values: values.sort((a, b) => b["Impact MA to 0 on SCR"] - a["Impact MA to 0 on SCR"])
        }))
        .sort((a, b) => a.yearMonth - b.yearMonth);

    x.domain([0, maxImpactValue]);

    let index = 0;
    let timer;

    const update = (data) => {
        const barHeight = height / (data.values.length + 1);  // Add space for x-axis
        const logoHeight = barHeight * 0.8; // Set logo height to 80% of bar height

        y.domain(data.values.map(d => d["Firm Short"])).range([0, data.values.length * (barHeight * 1.1)]); // Increase range by 10%

        gX.transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .call(xAxis);

        const bars = svg.selectAll(".bar")
            .data(data.values, d => d["Firm Short"]);

        bars.exit().remove();

        const barsEnter = bars.enter().append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(0, ${y(d["Firm Short"])})`);

        barsEnter.append("rect")
            .attr("x", logoHeight + 5)
            .attr("width", 0)
            .attr("height", barHeight - 5)
            .style("stroke", "white")
            .style("stroke-width", "1px");

        barsEnter.append("image")
            .attr("xlink:href", d => `https://raw.githubusercontent.com/munkiepus/mabenefit/main/icons/${d["Firm Short"]}.png`)
            .attr("x", 0)
            .attr("y", (barHeight - logoHeight) / 2) // Center the logo vertically in the bar
            .attr("width", logoHeight) // Use logoHeight for width
            .attr("height", logoHeight); // Use logoHeight for height

        barsEnter.append("text")
            .attr("class", "value-label")
            .attr("x", d => x(d["Impact MA to 0 on SCR"]) + 100) // Space to the right of the bar
            .attr("y", (barHeight - 5) / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "white")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .style("text-shadow", "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black");

        const barsUpdate = barsEnter.merge(bars);

        barsUpdate.transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr("transform", d => `translate(0, ${y(d["Firm Short"])})`);

        barsUpdate.select("rect")
            .transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr("width", d => x(d["Impact MA to 0 on SCR"]))
            .attr("height", barHeight - 5)
            .style("fill", d => d.Colour);

        barsUpdate.select(".value-label")
            .transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr("x", d => x(d["Impact MA to 0 on SCR"]) + 100) // Space to the right of the bar
            .attr("y", (barHeight - 5) / 2)
            .text(d => `£${d3.format(",.0f")(d["Impact MA to 0 on SCR"] / 1e6)}M`); // Add "£" and format with commas

        yearLabel.transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .text(`${data.yearMonth.getFullYear()}`);
    };

    const startAnimation = () => {
        index = 0; // Start at the first index
        const delay = 500; // Pause duration for December in milliseconds
        const yearDelay = 3000; // Delay between year transitions in milliseconds

        const animate = () => {
            // Check if the current index is within the bounds
            if (index < nestedData.length) {
                const currentData = nestedData[index];
                update(currentData); // Update the chart with the current data

                // Get the month from yearMonth
                const month = new Date(currentData.yearMonth).getMonth(); // Get month from date

                // Increment the index for the next iteration
                index++;

                // Check if the current month is December (11)
                if (month === 11) {
                    // Pause before continuing
                    setTimeout(() => {
                        animate(); // Continue the animation after the pause
                    }, yearDelay);
                } else {
                    // Continue with normal interval between year transitions
                    setTimeout(animate, delay); // Use yearDelay for normal transitions
                }
            } else {
                // Stop the animation when the end of the data is reached
                console.log("Animation complete.");
            }
        };

        animate(); // Start the animation loop
    };

    // Initial update to start the animation at the earliest year
    update(nestedData[0]);

    // Start animation 3 seconds after page load
    setTimeout(() => {
        startAnimation();
    }, 3000);
});
