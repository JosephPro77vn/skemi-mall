/**
 * SKMEI Watch Clone - Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Send form data to server (to be implemented)
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Thank you for your message. We will get back to you soon!');
                    contactForm.reset();
                } else {
                    alert('There was an error sending your message. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error sending your message. Please try again.');
            });
        });
    }

    // Product image gallery (for product detail page)
    const productThumbnails = document.querySelectorAll('.product-thumbnails img');
    if (productThumbnails.length > 0) {
        productThumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Remove active class from all thumbnails
                productThumbnails.forEach(thumb => thumb.classList.remove('active'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active');
                
                // Update main product image
                const mainImage = document.querySelector('.product-detail-img');
                mainImage.src = this.src;
            });
        });
    }

    // Filter products by category (for product listing page)
    const categoryFilters = document.querySelectorAll('.category-filter');
    if (categoryFilters.length > 0) {
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all filters
                categoryFilters.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked filter
                this.classList.add('active');
                
                // Get category slug
                const categorySlug = this.getAttribute('data-category');
                
                // Filter products (to be implemented with API)
                filterProducts(categorySlug);
            });
        });
    }

    // Function to filter products by category
    function filterProducts(categorySlug) {
        // This will be implemented with API calls
        console.log(`Filtering products by category: ${categorySlug}`);
        
        // Example implementation (to be replaced with actual API call)
        fetch(`/api/products?category=${categorySlug}`)
            .then(response => response.json())
            .then(data => {
                // Update product grid with filtered products
                updateProductGrid(data.products);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Function to update product grid
    function updateProductGrid(products) {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        
        // Clear current products
        productGrid.innerHTML = '';
        
        // Add filtered products
        products.forEach(product => {
            const productCard = createProductCard(product);
            productGrid.appendChild(productCard);
        });
    }

    // Function to create product card
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                <div class="card-body text-center">
                    <h5 class="card-title">${product.name}</h5>
                    <a href="/products/${product.slug}" class="btn btn-outline-primary">View Details</a>
                </div>
            </div>
        `;
        return card;
    }
});

