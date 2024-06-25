const margin = { top: 20, right: 30, bottom: 40, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data from CSV file
d3.csv("flatdata.csv").then(function(data) {
    // Parse data
    data.forEach(d => {
        d.year = +d.year; // Convert year to number
        d["Impact MA to 0 on SCR"] = +d["Impact MA to 0 on SCR"]; // Convert Impact MA to 0 on SCR to number
        // Assuming "firm short" is a string, adjust as needed
        d["firm short"] = d["firm short"].trim(); // Trim any extra whitespace
    });

    // Set up scales and axes
    const x = d3.scaleBand()
        .domain(data.map(d => d["firm short"]))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d["Impact MA to 0 on SCR"]), d3.max(data, d => d["Impact MA to 0 on SCR"])])
        .range([height, 0]);

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

    // Initialize simulation
    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(d => x(d["firm short"])).strength(1))
        .force("y", d3.forceY(d => y(d["Impact MA to 0 on SCR"])).strength(1))
        .force("collide", d3.forceCollide(4))
        .stop();

    // Run simulation to position nodes
    for (let i = 0; i < 120; ++i) simulation.tick();

    // Draw circles for each data point
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("r", 4)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .style("fill", "steelblue");

    // Function to update positions and restart simulation
    const update = () => {
        simulation
            .nodes(data)
            .on("tick", () => {
                svg.selectAll("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        simulation.alpha(1).restart();
    };

    // Periodically update data and restart simulation
    setInterval(() => {
        data.forEach(d => {
            // Adjust "Impact MA to 0 on SCR" randomly in this example
            d["Impact MA to 0 on SCR"] = Math.random() * (d3.max(data, d => d["Impact MA to 0 on SCR"]) - d3.min(data, d => d["Impact MA to 0 on SCR"])) + d3.min(data, d => d["Impact MA to 0 on SCR"]);
        });
        simulation.nodes(data).alpha(1).restart();
    }, 2000);

    // Initial update
    update();

}).catch(function(error) {
    console.error("Error loading data:", error);
});
