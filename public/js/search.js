document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    searchInput.addEventListener("input", async function () {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            searchResults.innerHTML = ""; // Clear results if input is too short
            return;
        }
        
        performSearch(query);
    });
});

function performSearch(query) {
    if (query.trim() === '') {
        alert('Please enter a search term.');
        return;
    }
    
    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(orders => {
            const searchResults = document.getElementById('searchResults');
            if (orders.length === 0) {
                searchResults.innerHTML = "<p class='text-muted text-center'>No results found</p>";
                return;
            }
            
            searchResults.innerHTML = `
                <div class="container">
                    <h1 class="text-center my-4">Search Results</h1>
                    <div class="row">
                        ${orders.map(order => `
                            <div class="col-md-4 mb-4">
                                <div class="product-card">
                                    <div class="product-image">
                                        <img src="${order.urlImage}" alt="${order.productName}">
                                    </div>
                                    <div class="product-details">
                                        <h5>${order.productName}</h5>
                                        <div class="rating">
                                            ${generateStars(order.rating)}
                                        </div>
                                        <p class="price">
                                            ${order.discountPrice 
                                                ? `<b>$${order.discountPrice}</b> <span style="text-decoration: line-through;">$${order.originalPrice}</span>`
                                                : `<b>$${order.originalPrice}</b>`
                                            }
                                        </p>
                                        <p class="card-text"><b>Brand:</b> ${order.productBrand}</p>
                                        <p class="card-text"><b>In Stock:</b> ${order.inStock ? 'Yes' : 'No'}</p>
                                        <div class="d-flex justify-content-between">
                                            <a href="/preview/${order._id}" class="btn btn-primary btn-sm">
                                                <i class="fas fa-eye me-1"></i> Preview
                                            </a>
                                            ${order.isAuthenticated && order.userRole === 'customer' 
                                                ? `<button onclick="addToCart('${order._id}')" class="btn btn-success btn-sm">
                                                    <i class="fas fa-shopping-cart me-1"></i> Add to Cart
                                                  </button>`
                                                : `<button disabled class="btn btn-secondary btn-sm">
                                                    <i class="fas fa-shopping-cart me-1"></i> Add to Cart (Login Required)
                                                  </button>`
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error("Error fetching search results:", error);
            document.getElementById('searchResults').innerHTML = "<p class='text-danger text-center'>Error fetching results</p>";
        });
}

// Function to generate rating stars dynamically
function generateStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? `<span class="star active">&#9733;</span>` : `<span class="star">&#9734;</span>`;
    }
    return stars;
}
