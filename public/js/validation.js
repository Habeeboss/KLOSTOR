document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            alert('Please fill all required fields');
        }
    });
});