/*
Author:Lihawu Tech;
License:MIT License
*/

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDA9_SmJ48yLbJvJULBn2GWYCq7GAYJRYU",
    authDomain: "music-dj-331b7.firebaseapp.com",
    projectId: "music-dj-331b7",
    storageBucket: "music-dj-331b7.appspot.com",
    messagingSenderId: "17659646784",
    appId: "1:17659646784:web:1fa29a50abb6990b1060a5",
    measurementId: "G-0TNBNB04VY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
/*
Author:Lihawu Tech;
License:MIT License
*/
$(document).ready(function () {
    // Sidebar toggle
    $("#menu-toggle").click(function (e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });
/*
Author:Lihawu Tech;
License:MIT License
*/
    // Sidebar collapse on small screens when clicking outside
    $(document).click(function (e) {
        if ($(window).width() < 768 && !$(e.target).closest('#sidebar-wrapper, #menu-toggle').length) {
            $("#wrapper").removeClass("toggled");
        }
    });

    // Content section management
    $(".list-group-item").click(function (e) {
        e.preventDefault();
        const target = $(this).data('target');

        $(".content-section").removeClass('active');
        $(".list-group-item").removeClass('active');

        $(target).addClass('active');
        $(this).addClass('active');

        if ($(window).width() < 768) {
            $("#wrapper").removeClass("toggled");
        }
    });

    $("#adminProfileForm").on("submit", async function (e) {
        e.preventDefault();
        await saveAdminData();
    });
/*
Author:Lihawu Tech;
License:MIT License
*/
    // Handle cancel button click to close the form
    $("#cancel-button").on("click", function () {
        $("#adminForm").hide();
    });

    // Handle logout
    $("#logout-button").click(function () {
        window.location.href = "../index.html"; // Redirect to login page
    });

    // Fetch data for admin profile picture
    loadAdminProfilePicture();
    loadAdminData();
    fetchEventsData();
    fetchNewsData();

    // Load bookings when the bookings tab is clicked
    $(".list-group-item[data-target='#bookings']").click(function () {
        loadBookings();
    });

    // Initial load of bookings if we're on the bookings tab
    if (window.location.hash === '#bookings') {
        loadBookings();
    }

    // Load playlists
    loadPlaylists();

    // Update dashboard statistics
    updateDashboardStats();
    loadRecentActivity();

    // Refresh dashboard data every 5 minutes
    setInterval(() => {
        updateDashboardStats();
        loadRecentActivity();
    }, 5 * 60 * 1000);
});

// Function to load the admin profile picture
async function loadAdminProfilePicture() {
    try {
        const adminSnapshot = await db.collection("Admin").limit(1).get();
        if (!adminSnapshot.empty) {
            const adminData = adminSnapshot.docs[0].data();
            const profileImageUrl = adminData.imageUrl || "../img/bg-img/add3.gif";
            document.getElementById("sidebar-profile-picture").src = profileImageUrl;
        } else {
            console.error("No admin document found.");
            document.getElementById("sidebar-profile-picture").src = "../img/bg-img/add3.gif";
        }
    } catch (error) {
        console.error("Error loading admin profile picture:", error);
        document.getElementById("sidebar-profile-picture").src = "../img/bg-img/add3.gif";
    }
}

// Function to load admin data into the form
async function loadAdminData() {
    try {
        const adminSnapshot = await db.collection("Admin").limit(1).get();
        if (!adminSnapshot.empty) {
            const adminDoc = adminSnapshot.docs[0].data();
            document.getElementById("name").value = adminDoc.name || '';
            document.getElementById("email").value = adminDoc.email || '';
            document.getElementById("number").value = adminDoc.number || '';
        } else {
            console.log("No admin data found, ready to create a new one.");
        }
    } catch (error) {
        console.error("Error loading admin data:", error);
    }
}
/*
Author:Lihawu Tech;
License:MIT License
*/
// Function to save or update admin data
async function saveAdminData() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const number = document.getElementById("number").value;
    const password = document.getElementById("password").value;

    let imageUrl = "";
    const fileInput = document.getElementById("profileImagePreview");
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        imageUrl = await uploadImage(file, "AdminProfileImages");
    }

    try {
        const adminSnapshot = await db.collection("Admin").limit(1).get();
        if (adminSnapshot.empty) {
            await db.collection("Admin").add({ name, email, number, password, imageUrl });
            alert("Admin created successfully!");
        } else {
            const adminDocId = adminSnapshot.docs[0].id;
            await db.collection("Admin").doc(adminDocId).update({ name, email, number, password, imageUrl });
            alert("Admin updated successfully!");
        }
    } catch (error) {
        console.error("Error saving admin data:", error);
        alert("Error saving admin data.");
    }
}

function toggleAddNewsModal() {
    const modal = document.getElementById("addNewsModal");
    modal.style.display = modal.style.display === "none" ? "block" : "none";
}
// Function to add new news
function addNewNews() {
    const title = document.getElementById("newNewsTitle").value;
    const dateTimeValue = document.getElementById("newNewsDateTime").value;
    const description = document.getElementById("newNewsDescription").value;
    const fileInput = document.getElementById("newNewsImage");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image for the article.");
        return;
    }
/*
Author:Lihawu Tech;
License:MIT License
*/
    const newsData = {
        title: title,
        date: firebase.firestore.Timestamp.fromDate(new Date(dateTimeValue)),
        description: description,
        imageUrl: ""
    };

    db.collection("CommingEvents").add(newsData)
        .then((docRef) => {
            uploadNewNewsImage(docRef.id, file);  // Proceed to image upload
        })
        .catch((error) => {
            console.error("Error adding news: ", error);
            alert("Error adding news.");
        });
}

// Upload News Image
function uploadNewNewsImage(newsId, file) {
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`newsImages/${newsId}/${file.name}`);

    imageRef.put(file)
        .then(() => imageRef.getDownloadURL())
        .then((url) => {
            return db.collection("CommingEvents").doc(newsId).update({ imageUrl: url });
        })
        .then(() => {
            alert("News article added successfully with image!");
            fetchNewsData();  // Refresh news data to show the new article
        })
        .catch((error) => {
            console.error("Error uploading image to Firebase Storage: ", error);
            alert("Error uploading image.");
        });
}
/*
Author:Lihawu Tech;
License:MIT License
*/
// Fetch News Data
function fetchNewsData() {
    db.collection("CommingEvents").onSnapshot((snapshot) => {
        const newsContainer = $("#news-container");
        newsContainer.empty(); // Clear the news container

        snapshot.forEach((doc) => {
            const newsData = doc.data();
            const newsId = doc.id;

            const newsCard = `
            <div class="bg-white shadow-lg rounded-lg overflow-hidden transition-transform transform hover:scale-105 relative m-4 p-4">
                <img src="${newsData.imageUrl || 'placeholder-image-url.jpg'}" alt="${newsData.title || 'News Image'}" class="w-full h-48 object-cover" 
                     onclick="triggerImageUpload('${newsId}', 'news')" />
                <input type="file" id="file-upload-${newsId}" style="display: none;" onchange="uploadImage('${newsId}', 'news', this.files[0])" />
                <div class="p-4">
                    <input type="text" class="font-bold text-xl text-midnight-blue border-b-2 border-gray-300 focus:outline-none focus:border-blue-500" 
                           value="${newsData.title || 'News Title'}" id="news-title-${newsId}" />
                    <p class="text-gray-500" id="news-date-${newsId}">${formatDate(newsData.date) || 'News Date'}</p>
                    <textarea class="text-gray-700 mt-2 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500" 
                              id="news-description-${newsId}">${newsData.description || 'News Description'}</textarea>
                </div>
                <div class="absolute bottom-2 right-2 flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="saveNews('${newsId}')">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteNews('${newsId}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            `;

            newsContainer.append(newsCard);  // Append each news card
        });
    }, (error) => {
        console.error("Error fetching news: ", error);
    });
}

// Trigger Image Upload
function triggerImageUpload(id, type) {
    const fileInput = document.getElementById(`file-upload-${id}`);
    fileInput.click(); // Trigger the file input click
}

// Upload Image
async function uploadImage(id, type, file) {
    if (!file) {
        alert("No file selected.");
        return;
    }

    const collection = type === 'news' ? "CommingEvents" : "PrviousEvents";
    const docRef = db.collection(collection).doc(id);

    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`${type}Images/${id}/${file.name}`);

    try {
        await imageRef.put(file);
        const url = await imageRef.getDownloadURL();
        await docRef.update({ imageUrl: url });
        alert("Image updated successfully!");
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image.");
    }
}
/*
Author:Lihawu Tech;
License:MIT License
*/
// Delete News
function deleteNews(newsId) {
    if (confirm("Are you sure you want to delete this article?")) {
        db.collection("CommingEvents").doc(newsId).delete()
            .then(() => {
                console.log("News article successfully deleted!");
                alert("News article deleted successfully!");
            })
            .catch((error) => {
                console.error("Error removing article: ", error);
                alert("Error deleting article.");
            });
    }
}

function toggleAddEventModal() {
    const modal = document.getElementById("addEventModal");
    modal.style.display = modal.style.display === "none" ? "block" : "none";
}
// Fetch Events Data
function fetchEventsData() {
    db.collection("PrviousEvents").onSnapshot((snapshot) => {
        const eventsContainer = $("#events-container");
        eventsContainer.empty(); // Clear the events container

        snapshot.forEach((doc) => {
            const eventData = doc.data();
            const eventId = doc.id;

            const eventCard = `
            <div class="bg-white shadow-lg rounded-lg overflow-hidden transition-transform transform hover:scale-105 relative m-4 p-4">
                <img src="${eventData.imageUrl || 'placeholder-image-url.jpg'}" alt="${eventData.title || 'Event Image'}" class="w-full h-48 object-cover" 
                     onclick="triggerImageUpload('${eventId}', 'event')" />
                <input type="file" id="file-upload-${eventId}" style="display: none;" onchange="uploadImage('${eventId}', 'event', this.files[0])" />
                <div class="p-4">
                    <input type="text" class="font-bold text-xl text-midnight-blue border-b-2 border-gray-300 focus:outline-none focus:border-blue-500" 
                           value="${eventData.title || 'Event Title'}" id="event-title-${eventId}" />
                    <p class="text-gray-500" id="event-date-${eventId}">${formatDate(eventData.date) || 'Event Date'}</p>
                    <textarea class="text-gray-700 mt-2 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500" 
                              id="event-description-${eventId}">${eventData.description || 'Event Description'}</textarea>
                </div>
                <div class="absolute bottom-2 right-2 flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="saveEvent('${eventId}')">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteEvent('${eventId}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            `;

            eventsContainer.append(eventCard);  // Append each event card
        });
    }, (error) => {
        console.error("Error fetching events: ", error);
    });
}

// Add New Event
function addNewEvent() {
    const title = document.getElementById("newEventTitle").value;
    const dateTimeValue = document.getElementById("newEventDateTime").value;
    const description = document.getElementById("newEventDescription").value;
    const fileInput = document.getElementById("newEventImage");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image for the event.");
        return;
    }

    const eventData = {
        title: title,
        date: firebase.firestore.Timestamp.fromDate(new Date(dateTimeValue)),
        description: description,
        imageUrl: ""
    };

    db.collection("PrviousEvents").add(eventData)
        .then((docRef) => {
            uploadNewEventImage(docRef.id, file);
        })
        .catch((error) => {
            console.error("Error adding event: ", error);
            alert("Error adding event.");
        });
}

// Upload Event Image
function uploadNewEventImage(eventId, file) {
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`eventImages/${eventId}/${file.name}`);

    imageRef.put(file)
        .then(() => imageRef.getDownloadURL())
        .then((url) => {
            return db.collection("PrviousEvents").doc(eventId).update({ imageUrl: url });
        })
        .then(() => {
            alert("Event added successfully!");
            fetchEventsData(); // Refresh event data
        })
        .catch((error) => {
            console.error("Error uploading image to Firebase Storage: ", error);
            alert("Error uploading image.");
        });
}

// Format Date Function
function formatDate(date) {
    if (date instanceof firebase.firestore.Timestamp) {
        date = date.toDate();
    } else if (typeof date === 'string') {
        date = new Date(date);
    } else {
        return 'Invalid date';
    }
/*
Author:Lihawu Tech;
License:MIT License
*/
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    return date.toLocaleString('en-US', options);
}
/*
Author:Lihawu Tech;
License:MIT License
*/

// Add these variables at the top of your file
let currentSection = 'dashboard';
const sections = ['dashboard', 'PreviousEvents', 'ComingEvents', 'playlist', 'bookings', 'messages'];

// Function to switch between sections
function switchSection(sectionId) {
    console.log('Switching to section:', sectionId); // Debug log
    
    // Hide all sections
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        currentSection = sectionId;

        // Load section-specific content
        if (sectionId === 'bookings') {
            loadBookings();
        }
    }
}

// Function to load bookings
async function loadBookings() {
    console.log('Loading bookings...'); // Debug log
    const bookingsTableBody = document.getElementById('bookings-table-body');
    
    if (!bookingsTableBody) {
        console.error('Bookings table body element not found');
        return;
    }

    try {
        // Show loading state
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center">
                    <div class="flex justify-center items-center">
                        <i class="fas fa-spinner fa-spin mr-2"></i> Loading bookings...
                    </div>
                </td>
            </tr>
        `;

        const bookingsSnapshot = await db.collection('Bookings')
            .orderBy('timestamp', 'desc')
            .get();

        console.log('Fetched bookings:', bookingsSnapshot.size); // Debug log

        // Clear the loading state
        bookingsTableBody.innerHTML = '';

        if (bookingsSnapshot.empty) {
            bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        No bookings found
                    </td>
                </tr>
            `;
            return;
        }

        bookingsSnapshot.forEach((doc) => {
            const booking = doc.data();
            const bookingId = doc.id;
            console.log('Processing booking:', booking); // Debug log

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${booking.name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${booking.email || 'N/A'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${booking.message || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDate(booking.timestamp?.toDate())}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select onchange="updateBookingStatus('${bookingId}', this.value)" 
                            class="text-sm rounded-full px-3 py-1 ${getStatusColor(booking.status)}">
                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteBooking('${bookingId}')" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            bookingsTableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    Error loading bookings: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Function to update booking status
async function updateBookingStatus(bookingId, newStatus) {
    try {
        await db.collection("Bookings").doc(bookingId).update({
            status: newStatus,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Booking status updated successfully!");
    } catch (error) {
        console.error("Error updating booking status:", error);
        alert("Error updating booking status: " + error.message);
    }
}

// Function to delete booking
async function deleteBooking(bookingId) {
    if (confirm("Are you sure you want to delete this booking?")) {
        try {
            await db.collection("Bookings").doc(bookingId).delete();
            alert("Booking deleted successfully!");
            loadBookings(); // Refresh the bookings list
        } catch (error) {
            console.error("Error deleting booking:", error);
            alert("Error deleting booking: " + error.message);
        }
    }
}

// Add this helper function if you don't already have it
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to toggle the Add Playlist modal
function toggleAddPlaylistModal() {
    const modal = document.getElementById("addPlaylistModal");
    modal.style.display = modal.style.display === "none" ? "block" : "none";
}

// Function to add new playlist
async function addNewPlaylist() {
    const title = document.getElementById("newPlaylistTitle").value;
    const artist = document.getElementById("newPlaylistArtist").value;
    const description = document.getElementById("newPlaylistDescription").value;
    const playlistUrl = document.getElementById("newPlaylistUrl").value;
    const fileInput = document.getElementById("newPlaylistImage");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image for the playlist.");
        return;
    }

    try {
        // Create playlist document first
        const playlistData = {
            title: title,
            artist: artist,
            description: description,
            playlistUrl: playlistUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("playList").add(playlistData);
        
        // Upload image and update document with image URL
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`playlistImages/${docRef.id}/${file.name}`);
        
        const snapshot = await imageRef.put(file);
        const imageUrl = await snapshot.ref.getDownloadURL();
        
        await docRef.update({ imageUrl: imageUrl });

        alert("Playlist added successfully!");
        toggleAddPlaylistModal();
        loadPlaylists();
        
        // Clear form
        document.getElementById("newPlaylistTitle").value = "";
        document.getElementById("newPlaylistArtist").value = "";
        document.getElementById("newPlaylistDescription").value = "";
        document.getElementById("newPlaylistUrl").value = "";
        document.getElementById("newPlaylistImage").value = "";
        
    } catch (error) {
        console.error("Error adding playlist:", error);
        alert("Error adding playlist: " + error.message);
    }
}

// Function to load playlists
async function loadPlaylists() {
    const playlistTableBody = document.getElementById("playlist-table-body");
    
    try {
        const playlistsSnapshot = await db.collection("playList")
            .orderBy("timestamp", "desc")
            .get();

        playlistTableBody.innerHTML = "";

        if (playlistsSnapshot.empty) {
            playlistTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center">No playlists found</td>
                </tr>`;
            return;
        }

        playlistsSnapshot.forEach((doc) => {
            const playlist = doc.data();
            const playlistId = doc.id;
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="px-6 py-4">${playlist.title || 'N/A'}</td>
                <td class="px-6 py-4">${playlist.artist || 'N/A'}</td>
                <td class="px-6 py-4">${playlist.description || 'N/A'}</td>
                <td class="px-6 py-4">
                    <button onclick="deletePlaylist('${playlistId}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            playlistTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading playlists:", error);
        alert("Error loading playlists: " + error.message);
    }
}

// Function to delete playlist
async function deletePlaylist(playlistId) {
    if (confirm("Are you sure you want to delete this playlist?")) {
        try {
            await db.collection("playList").doc(playlistId).delete();
            alert("Playlist deleted successfully!");
            loadPlaylists();
        } catch (error) {
            console.error("Error deleting playlist:", error);
            alert("Error deleting playlist: " + error.message);
        }
    }
}

// Function to update dashboard statistics
async function updateDashboardStats() {
    try {
        // Get total events (both previous and coming)
        const prevEventsSnapshot = await db.collection("PrviousEvents").get();
        const comingEventsSnapshot = await db.collection("CommingEvents").get();
        const totalEvents = prevEventsSnapshot.size + comingEventsSnapshot.size;
        document.getElementById("totalEvents").textContent = totalEvents;

        // Get total bookings
        const bookingsSnapshot = await db.collection("Bookings").get();
        document.getElementById("totalBookings").textContent = bookingsSnapshot.size;

        // Get total playlists
        const playlistsSnapshot = await db.collection("playList").get();
        document.getElementById("totalPlaylists").textContent = playlistsSnapshot.size;

        // Get total messages
        const messagesSnapshot = await db.collection("Messages").get();
        document.getElementById("totalMessages").textContent = messagesSnapshot.size;
    } catch (error) {
        console.error("Error updating dashboard stats:", error);
    }
}

// Function to load recent activity
async function loadRecentActivity() {
    const activityContainer = document.getElementById("recentActivity");
    activityContainer.innerHTML = ""; // Clear existing content

    try {
        // Get recent bookings
        const recentBookings = await db.collection("Bookings")
            .orderBy("timestamp", "desc")
            .limit(3)
            .get();

        // Get recent events
        const recentEvents = await db.collection("CommingEvents")
            .orderBy("timestamp", "desc")
            .limit(3)
            .get();

        // Get recent playlists
        const recentPlaylists = await db.collection("playList")
            .orderBy("timestamp", "desc")
            .limit(3)
            .get();

        // Combine and sort all activities
        const activities = [];

        recentBookings.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'booking',
                timestamp: data.timestamp,
                text: `New booking from ${data.name}`,
                icon: 'fa-ticket-alt text-green-500'
            });
        });

        recentEvents.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'event',
                timestamp: data.timestamp,
                text: `New event added: ${data.place}`,
                icon: 'fa-calendar text-blue-500'
            });
        });

        recentPlaylists.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'playlist',
                timestamp: data.timestamp,
                text: `New playlist added: ${data.title}`,
                icon: 'fa-music text-purple-500'
            });
        });

        // Sort activities by timestamp
        activities.sort((a, b) => b.timestamp - a.timestamp);

        // Display activities
        activities.slice(0, 5).forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'flex items-center p-3 border-b border-gray-200';
            activityElement.innerHTML = `
                <div class="bg-gray-100 p-2 rounded-full mr-4">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div>
                    <p class="text-sm">${activity.text}</p>
                    <p class="text-xs text-gray-500">${formatTimestamp(activity.timestamp)}</p>
                </div>
            `;
            activityContainer.appendChild(activityElement);
        });

    } catch (error) {
        console.error("Error loading recent activity:", error);
        activityContainer.innerHTML = '<p class="text-red-500">Error loading recent activity</p>';
    }
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((date - new Date()) / (1000 * 60 * 60 * 24)),
        'day'
    );
}

// Function to load messages
async function loadMessages(type = 'all') {
    const messagesTableBody = document.getElementById("messages-table-body");
    
    if (!messagesTableBody) {
        console.error("Messages table body element not found");
        return;
    }

    try {
        let query = db.collection("Messages").orderBy("timestamp", "desc");
        
        if (type !== 'all') {
            query = query.where("type", "==", type);
        }

        const messagesSnapshot = await query.get();
        messagesTableBody.innerHTML = "";

        if (messagesSnapshot.empty) {
            messagesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        No messages found
                    </td>
                </tr>
            `;
            return;
        }

        messagesSnapshot.forEach((doc) => {
            const message = doc.data();
            const messageId = doc.id;
            const date = message.timestamp ? formatDate(message.timestamp.toDate()) : 'N/A';
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="px-6 py-4">${message.name || 'N/A'}</td>
                <td class="px-6 py-4">${message.email || 'N/A'}</td>
                <td class="px-6 py-4">${message.type || 'N/A'}</td>
                <td class="px-6 py-4">${message.message || 'N/A'}</td>
                <td class="px-6 py-4">${date}</td>
                <td class="px-6 py-4">
                    <button onclick="deleteMessage('${messageId}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            messagesTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading messages:", error);
        if (messagesTableBody) {
            messagesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-500">
                        Error loading messages: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Function to delete message
async function deleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
        try {
            await db.collection("Messages").doc(messageId).delete();
            alert("Message deleted successfully!");
            loadMessages();
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Error deleting message: " + error.message);
        }
    }
}

// Add these event listeners to your existing DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded'); // Debug log

    // Add click handlers for navigation
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) {
                const sectionId = target.replace('#', '');
                console.log('Navigation clicked:', sectionId); // Debug log
                switchSection(sectionId);
            }
        });
    });

    // Show dashboard by default
    switchSection('dashboard');

    // Load bookings
    loadBookings();

    // Load messages
    loadMessages();
});

// Helper functions
function getStatusColor(status) {
    switch (status) {
        case 'confirmed':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// When a new message is received, it will have read: false by default
const newMessage = {
    name: name,
    email: email,
    message: message,
    type: messageType,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    read: false
};

// Function to update message counts
async function updateMessageCounts() {
    try {
        const messagesSnapshot = await db.collection("Messages").get();
        const unreadSnapshot = await db.collection("Messages")
            .where("read", "==", false)
            .get();

        const totalMessages = messagesSnapshot.size;
        const unreadCount = unreadSnapshot.size;

        // Update dashboard counts
        document.getElementById("totalMessages").textContent = totalMessages;
        const unreadElement = document.getElementById("unreadMessages");
        unreadElement.textContent = `${unreadCount} new`;
        
        // Show/hide unread badge
        if (unreadCount > 0) {
            unreadElement.style.display = "inline-block";
        } else {
            unreadElement.style.display = "none";
        }

        // Update sidebar message counter if it exists
        const sidebarCounter = document.querySelector("#message-counter");
        if (sidebarCounter) {
            sidebarCounter.textContent = unreadCount > 0 ? unreadCount : "";
            sidebarCounter.style.display = unreadCount > 0 ? "inline-block" : "none";
        }

    } catch (error) {
        console.error("Error updating message counts:", error);
    }
}

// Function to load messages
async function loadMessages(type = 'all') {
    const messagesTableBody = document.getElementById("messages-table-body");
    
    if (!messagesTableBody) {
        console.error("Messages table body element not found");
        return;
    }

    try {
        let query = db.collection("Messages").orderBy("timestamp", "desc");
        if (type !== 'all') {
            query = query.where("type", "==", type);
        }

        const messagesSnapshot = await query.get();
        messagesTableBody.innerHTML = "";

        if (messagesSnapshot.empty) {
            messagesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No messages found
                    </td>
                </tr>
            `;
            return;
        }

        messagesSnapshot.forEach((doc) => {
            const message = doc.data();
            const messageId = doc.id;
            const row = document.createElement("tr");
            row.className = message.read ? 'bg-white' : 'bg-blue-50';
            row.innerHTML = `
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${message.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}">
                        ${message.read ? 'Read' : 'New'}
                    </span>
                </td>
                <td class="px-6 py-4">${message.name || 'N/A'}</td>
                <td class="px-6 py-4">${message.email || 'N/A'}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${message.type === 'complaint' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${message.type || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4">${message.message || 'N/A'}</td>
                <td class="px-6 py-4">${formatDate(message.timestamp?.toDate())}</td>
                <td class="px-6 py-4">
                    <button onclick="toggleMessageRead('${messageId}', ${!message.read})" 
                            class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas ${message.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                    </button>
                    <button onclick="deleteMessage('${messageId}')" 
                            class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            messagesTableBody.appendChild(row);
        });

        // Update message counts
        updateMessageCounts();

    } catch (error) {
        console.error("Error loading messages:", error);
        messagesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-red-500">
                    Error loading messages: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Function to toggle message read status
async function toggleMessageRead(messageId, read) {
    try {
        await db.collection("Messages").doc(messageId).update({
            read: read
        });
        loadMessages();
        updateMessageCounts();
    } catch (error) {
        console.error("Error updating message status:", error);
        alert("Error updating message status: " + error.message);
    }
}

// Function to mark all messages as read
async function markAllMessagesAsRead() {
    try {
        const unreadSnapshot = await db.collection("Messages")
            .where("read", "==", false)
            .get();

        const batch = db.batch();
        unreadSnapshot.forEach((doc) => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
        loadMessages();
        updateMessageCounts();
        alert("All messages marked as read");
    } catch (error) {
        console.error("Error marking all messages as read:", error);
        alert("Error marking messages as read: " + error.message);
    }
}

// Add these to your existing DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
    // ... existing code ...
    updateMessageCounts();
    
    // Set up real-time listener for new messages
    db.collection("Messages")
        .where("read", "==", false)
        .onSnapshot((snapshot) => {
            updateMessageCounts();
        });
});

function scrollPlaylists(direction) {
    const container = document.getElementById('admin-playlist-container');
    const scrollAmount = 400; // Adjust this value based on your needs
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// Function to load playlists in admin view
async function loadAdminPlaylists() {
    const playlistContainer = document.getElementById("admin-playlist-container");
    
    if (!playlistContainer) {
        console.error("Playlist container element not found!");
        return;
    }

    try {
        const playlistsSnapshot = await getDocs(collection(db, "playList"));
        playlistContainer.innerHTML = "";

        if (playlistsSnapshot.empty) {
            playlistContainer.innerHTML = `
                <div class="w-full text-center p-4">
                    <p class="text-gray-500">No playlists found. Add some playlists to get started!</p>
                </div>`;
            return;
        }

        playlistsSnapshot.forEach((doc) => {
            const playlistData = doc.data();
            const { title, artist, imageUrl, description, playlistUrl } = playlistData;

            const playlistItem = document.createElement("div");
            playlistItem.classList.add("single-album");
            playlistItem.innerHTML = `
                <img src="${imageUrl || '../img/bg-img/default.jpg'}" alt="${title}" class="w-full h-48 object-cover">
                <div class="album-info p-4">
                    <h5 class="text-lg font-semibold">${title}</h5>
                    <p class="text-sm text-gray-600">${artist || 'Unknown Artist'}</p>
                    <p class="text-sm mt-2">${description || ''}</p>
                    <div class="flex justify-end mt-3">
                        <button onclick="editPlaylist('${doc.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deletePlaylist('${doc.id}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            playlistContainer.appendChild(playlistItem);
        });
    } catch (error) {
        console.error("Error loading playlists:", error);
        alert("Error loading playlists: " + error.message);
    }
}

// Function to handle section visibility
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // If this is the playlist section, load the playlists
        if (sectionId === 'playlist') {
            loadAdminPlaylists();
        }
    }
}

// Add click event listeners to sidebar links
document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.list-group-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            if (target) {
                const sectionId = target.replace('#', '');
                showSection(sectionId);
            }
        });
    });

    // Show default section (dashboard)
    showSection('dashboard');
});