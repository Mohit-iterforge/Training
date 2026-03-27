let data = [];
let page = 1;
let limit = 100;

async function fetchUserData() {
    const apiURL = 'https://jsonplaceholder.typicode.com/todos';
    const tableBody = document.getElementById('tableBody');

    try {
        // Fetch the data from the API endpoint
        const response = await fetch(apiURL);

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON data from the response
        const users = await response.json();

        data = users;   

        // data ko clear kr denge agar kuch hai toh
        tableBody.innerHTML = '';

        showTable();     //paginated data ko call kr rahe hai
        showPagination(); // and buttons ko

    } catch (error) {
        //this part will do error handling
        console.error('Error fetching user data:', error);
        tableBody.innerHTML = `<tr><td colspan="4">Error loading data. Please try again later.</td></tr>`;
    }
}

// pagination
function showTable() {
    const tableBody = document.getElementById('tableBody');

    let start = (page - 1) * limit;
    let end = start + limit;

    let users = data.slice(start, end);

    tableBody.innerHTML = '';

    // Loop through the users and create table rows
    users.forEach(user => {
        const row = document.createElement('tr'); // Create a new table row

        // Populate the row with table data cells
        row.innerHTML = `
            <td>${user.userId}</td>
            <td>${user.id}</td>
            <td>${user.title}</td>
            <td>${user.completed}</td>
        `;

        // new row append kr dega...
        tableBody.appendChild(row);
    });
}

// pagination buttons
function showPagination() {
    let total = Math.ceil(data.length / limit);
    let buttons = "";

    // Prev button
    buttons += `<button onclick="prevPage()" ${page === 1 ? "disabled" : ""}>Prev</button>`;

    // Page numbers
    for (let i = 1; i <= total; i++) {
        buttons += `<button onclick="changePage(${i})">${i}</button>`;
    }

    // Next button
    buttons += `<button onclick="nextPage()" ${page === total ? "disabled" : ""}>Next</button>`;

    document.getElementById("pagination").innerHTML = buttons;
}

// Change page
function changePage(p) {
    page = p;
    showTable();
    showPagination(); // update buttons
}

// Prev page
function prevPage() {
    if (page > 1) {
        page--;
        showTable();
        showPagination();
    }
}

// Next page
function nextPage() {
    let total = Math.ceil(data.length / limit);
    if (page < total) {
        page++;
        showTable();
        showPagination();
    }
}
fetchUserData();