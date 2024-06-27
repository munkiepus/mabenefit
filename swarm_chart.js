const margin = { top: 60, right: 30, bottom: 40, left: 150 }; // Increased left margin to 150
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data from CSV file
d3.csv("https://raw.githubusercontent.com/munkiepus/mabenefit/main/flatdata.csv").then(function(data) {
    // Parse data
    data.forEach(d => {
        d.Year = +d.Year; // Convert "Year" to number
        d["Impact MA to 0 on SCR"] = +d["Impact MA to 0 on SCR"]; // Convert Impact MA to 0 on SCR to number
        d["Integer-Division"] = +d["Integer-Division"]; // Convert Integer-Division to number
        // Update column name from "firm short" to "Firm Short"
        d["Firm Short"] = d["Firm Short"].trim(); // Trim any extra whitespace
        delete d["firm short"]; // Delete old column if needed
    });

    // Set up color scale based on "Colour" column
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d["Firm Short"]))
        .range(data.map(d => d.Colour)); // Use "Colour" column for colors

    // Set up scales and axes
    const x = d3.scaleBand()
        .domain(data.map(d => d["Firm Short"]))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d["Impact MA to 0 on SCR"]), d3.max(data, d => d["Impact MA to 0 on SCR"])])
        .range([height, 0]);

    // Scale for circle radius based on "Integer-Division"
    const radiusScale = d3.scaleLinear()
        .domain([d3.min(data, d => d["Integer-Division"]), d3.max(data, d => d["Integer-Division"])])
        .range([2, 10]); // Adjust range for desired minimum and maximum radius

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

    // Initialize simulation
    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(d => x(d["Firm Short"])).strength(1))
        .force("y", d3.forceY(d => y(d["Impact MA to 0 on SCR"])).strength(1))
        .force("collide", d3.forceCollide(d => radiusScale(d["Integer-Division"]) + 1)) // Adjust collision force based on radius
        .stop();

    // Run simulation to position nodes
    for (let i = 0; i < 120; ++i) simulation.tick();

    // Draw circles for each data point
    const circles = svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("r", d => radiusScale(d["Integer-Division"])) // Set radius based on "Integer-Division"
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .style("fill", d => colorScale(d["Firm Short"])) // Color based on "Colour" column
        .on("mouseover", (event, d) => {
            // Show tooltip on mouseover
            tooltip.style("visibility", "visible")
                .html(`<strong>${d["Firm Short"]}</strong><br>t: ${d.t}`);
        })
        .on("mousemove", (event) => {
            // Position tooltip relative to mouse pointer
            tooltip.style("top", `${event.pageY}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            // Hide tooltip on mouseout
            tooltip.style("visibility", "hidden");
        });

    // Tooltip element
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "rgba(255, 255, 255, 0.8)")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 0 10px rgba(0, 0, 0, 0.1)")
        .style("visibility", "hidden");

    // Display year from the data
    const currentYearText = svg.append("text")
        .attr("class", "current-year")
        .attr("x", width - 20)
        .attr("y", -20) // Adjust position relative to top margin
        .style("text-anchor", "end")
        .style("font-size", "24px")
        .style("fill", "#333");

    // Function to update positions and restart simulation
    const update = (year) => {
        const filteredData = data.filter(d => d.Year === year);

        simulation
            .nodes(filteredData)
            .force("x", d3.forceX(d => x(d["Firm Short"])).strength(1))
            .force("y", d3.forceY(d => y(d["Impact MA to 0 on SCR"])).strength(1))
            .force("collide", d3.forceCollide(d => radiusScale(d["Integer-Division"]) + 1)) // Adjust collision force based on radius
            .on("tick", () => {
                circles
                    .data(filteredData)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        simulation.alpha(1).restart();

        // Update current year text
        currentYearText.text(`Year: ${year}`);
    };

    // Get unique years from the dataset
    const years = Array.from(new Set(data.map(d => d.Year)));

    // Function to animate through years
    let index = 0;
    const animateYears = () => {
        update(years[index]);
        index = (index + 1) % years.length;
    };

    // Periodically update data and restart simulation
    setInterval(animateYears, 2000);

    // Initial update
    update(years[0]);

}).catch(function(error) {
    console.error("Error loading data:", error);
});
