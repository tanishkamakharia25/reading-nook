let library = JSON.parse(localStorage.getItem('myLibrary')) || [];
let currentBookId = null;

const colors = {
    'Fiction': '#bde0fe', 'Non-Fiction': '#d1e7dd', 'Mystery': '#e2d1f9', 
    'Romance': '#ffcad4', 'Academic': '#ffd8be', 'Thriller': '#a2d2ff',
    'Horror': '#ffb5a7', 'Sci-Fi': '#caffbf', 'Fantasy': '#faedcb',
    'Manhwa': '#9bf6ff', 'Manhua': '#bdb2ff', 'Dark': '#6b705c'
};

// Initialize Genre Selectors
const checkboxList = document.getElementById('checkbox-list');
Object.keys(colors).forEach(g => {
    checkboxList.innerHTML += `<label class="genre-option"><input type="checkbox" name="genre" value="${g}"> ${g}</label>`;
});

// Theme Handling
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}
if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');

function toggleSection(header) { header.classList.toggle('collapsed'); }

// --- API & COMMERCIAL LOGIC ---
async function fetchBookData(title, author) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title + ' ' + author)}&maxResults=1`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].volumeInfo.imageLinks?.thumbnail || null;
        }
    } catch (e) { return null; }
}

async function addBook() {
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim() || "Unknown Author";
    const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(cb => cb.value);
    
    if(!title) return;

    const cover = await fetchBookData(title, author);
    const shopUrl = `https://www.amazon.in/s?k=${encodeURIComponent(title + ' ' + author)}&tag=YOUR_ID_HERE`;

    library.push({ 
        id: Date.now(), title, author, cover, shopUrl,
        genres: selectedGenres.length ? selectedGenres : ['Fiction'], 
        status: 'tbr', rating: 0 
    });

    updateUI();
    document.getElementById('title').value = ''; 
    document.getElementById('author').value = '';
    document.querySelectorAll('input[name="genre"]').forEach(cb => cb.checked = false);
}

function moveStatus(id, newStatus) {
    if(newStatus === 'read') { 
        currentBookId = id; 
        document.getElementById('modal-overlay').style.display = 'flex'; 
    } else { 
        library = library.map(b => b.id === id ? {...b, status: newStatus} : b); 
        updateUI(); 
    }
}

function confirmRating() {
    const r = parseInt(document.getElementById('rating-dropdown').value);
    library = library.map(b => b.id === currentBookId ? {...b, status: 'read', rating: r} : b);
    document.getElementById('modal-overlay').style.display = 'none';
    updateUI();
}

function updateUI() {
    localStorage.setItem('myLibrary', JSON.stringify(library));
    const search = document.getElementById('search-bar').value.toLowerCase();
    const contents = { reading: '', tbr: '', read: '', dnf: '' };
    let totalRead = 0, sumRating = 0;

    library.forEach(b => {
        if(!b.title.toLowerCase().includes(search)) return;
        if(b.status === 'read') { totalRead++; sumRating += b.rating; }
        const mainColor = colors[b.genres[0]] || '#ddd';

        contents[b.status] += `
            <div class="book-card" style="border-left-color: ${mainColor}">
                ${b.cover ? `<img src="${b.cover}" class="book-cover">` : `<div class="letter-icon" style="background:${mainColor}">${b.title[0]}</div>`}
                <div class="book-info">
                    <div style="margin-bottom:4px;">${b.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}</div>
                    <strong>${b.title}</strong><br><small style="color:var(--muted)">${b.author}</small>
                </div>
                <div class="btn-group">
                    <div style="margin-bottom:5px;">
                        ${b.status === 'tbr' ? `<button class="action-btn" style="background:var(--fiction)" onclick="moveStatus(${b.id}, 'reading')">read</button>` : ''}
                        ${b.status === 'reading' ? `<button class="action-btn" style="background:var(--nonfiction)" onclick="moveStatus(${b.id}, 'read')">done</button>` : ''}
                        ${b.status === 'read' ? `<span>⭐${b.rating}</span>` : ''}
                    </div>
                    <a href="${b.shopUrl}" target="_blank" class="action-btn" style="background:var(--academic); text-decoration:none; display:inline-block;">🛒 shop</a>
                </div>
            </div>`;
    });

    Object.keys(contents).forEach(s => document.getElementById(s + '-content').innerHTML = contents[s] || '<p style="font-size:0.7rem; color:var(--muted); text-align:center;">Empty shelf.</p>');
    
    // Update Stats & Progress Bar
    document.getElementById('stat-total').innerText = totalRead;
    document.getElementById('stat-reading').innerText = library.filter(b => b.status === 'reading').length;
    document.getElementById('stat-avg').innerText = totalRead ? (sumRating/totalRead).toFixed(1) : '0';
    
    const progress = library.length ? (totalRead / library.length) * 100 : 0;
    document.getElementById('progress-bar').style.width = progress + "%";
}

updateUI();