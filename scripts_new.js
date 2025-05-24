// Function to validate Pakistani phone number
function isValidPakistaniPhoneNumber(phone) {
    // Remove any whitespace or dashes
    phone = phone.replace(/\s|-/g, '').trim();
    
    // Regex for Pakistani phone numbers: 0[3]xxxxxxxxx or +92[3]xxxxxxxxx
    const pakPhoneRegex = /^(0|\+92)[3][0-9]{9}$/;
    
    // Additional check for valid mobile codes (optional)
    const validMobileCodes = [
        '300', '301', '302', '303', '304', '305', '306', '307', '308', '309',
        '310', '311', '312', '313', '314', '315', '316', '317', '318', '319',
        '320', '321', '322', '323', '324', '325', '326', '327', '328', '329',
        '330', '331', '332', '333', '334', '335', '336', '337', '338', '339',
        '340', '341', '342', '343', '344', '345', '346', '347', '348', '349',
        '360', '361', '362', '363', '364', '365', '366', '367', '368', '369'
    ];
    
    // Check if the number matches the regex
    if (!pakPhoneRegex.test(phone)) {
        return false;
    }
    
    // Extract the mobile code (first 3 digits after 0 or +92)
    const mobileCode = phone.startsWith('+92') ? phone.slice(3, 6) : phone.slice(1, 4);
    
    // Verify mobile code is valid
    return validMobileCodes.includes(mobileCode);
}
// Slider Management
const sliders = {};

function initSlider(sliderId) {
    const slider = document.querySelector(`[data-slider-id="${sliderId}"]`);
    if (!slider) return;
    sliders[sliderId] = { currentSlide: 0 };
    sliders[sliderId].slideCount = slider.querySelectorAll('.slide').length;
}

function moveSlide(sliderId, direction) {
    const slider = sliders[sliderId];
    if (slider) {
        slider.currentSlide = (slider.currentSlide + direction + slider.slideCount) % slider.slideCount;
        const slides = document.querySelector(`[data-slider-id="${sliderId}"] .slides`);
        if (slides) {
            slides.style.transform = `translateX(-${slider.currentSlide * 100}%)`;
        }
    }
}

// Initialize static sliders
['dash-salon', 'booking-salon'].forEach(initSlider);

// Default Images and Placeholder
const defaultImages = [
    'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2Fsb24lMjBpbnRlcmlvcnxlbnwwfDB8MHx8fDA%3D',
    'https://images.unsplash.com/photo-1720358787956-85c0bd0a8dbb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8c2Fsb24lMjBpbnRlcmlvcnxlbnwwfDB8MHx8fDA%3D',
    'https://plus.unsplash.com/premium_photo-1664048713258-a1844e3d337f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c2Fsb24lMjBpbnRlcmlvcnxlbnwwfDB8MHx8fDA%3D'
];
const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" font-size="20" text-anchor="middle" fill="%23999" dy=".3em"%3EImage Loading...%3C/text%3E%3C/svg%3E';

// Helper to Format Time for Next Available Slot
function getNextAvailableTime(openTime, breaks = []) {
    let time = new Date(`2000-01-01T${openTime}`);
    time.setMinutes(time.getMinutes() + 30);
    const isBreak = breaks.some(b => {
        const breakStart = new Date(`2000-01-01T${b.from}`);
        const breakEnd = new Date(`2000-01-01T${b.to}`);
        return time >= breakStart && time < breakEnd;
    });
    if (isBreak) {
        time.setMinutes(time.getMinutes() + 30);
    }
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Loading Animation
function showLoadingAnimation(grid) {
    if (!grid) return () => {};
    grid.innerHTML = '<p id="loading-text" style="text-align: center; font-weight: bold; font-size: 1.2em;">loading.</p>';
    const states = ["loading.", "loading..", "loading...", "loading..", "loading.", "loading"];
    let index = 0;
    const interval = setInterval(() => {
        const loadingText = grid.querySelector('#loading-text');
        if (loadingText) {
            loadingText.textContent = states[index];
            index = (index + 1) % states.length;
        }
    }, 300);
    return () => {
        clearInterval(interval);
        grid.innerHTML = '';
    };
}

// Lazy-Load Images
function loadImagesForCard(card, images) {
    const slides = card.querySelectorAll('.slide');
    images.forEach((img, index) => {
        if (slides[index]) {
            const image = new Image();
            image.src = img;
            image.onload = () => {
                slides[index].style.backgroundImage = `url('${img}')`;
            };
            image.onerror = () => {
                slides[index].style.backgroundImage = `url('${defaultImages[index % defaultImages.length]}')`;
            };
        }
    });
}

// Track ongoing async operations
let currentAbortController = null;

// Track dashboard auto-reload
let dashboardReloadInterval = null;
let shouldScrollOnDashboard = true;

// Render Salons (Optimized)
async function renderSalons(signal) {
    const grid = document.getElementById('salon-grid');
    if (!grid) return;
    const clearLoading = showLoadingAnimation(grid);
    try {
        // Ensure salons is an array, fall back to empty array if null/undefined
        if (!Array.isArray(salons)) {
            salons = await getData("salons", { signal }) || [];
        }
        clearLoading();
        grid.innerHTML = '';
        if (salons.length === 0) {
            grid.innerHTML = '<p style="text-align: center;">No salons available. Register a salon to get started!</p>';
            return;
        }

        // Render cards with placeholders
        salons.forEach((salon, index) => {
            if(salon.status == "Active"){
                const sliderId = `salon-${index}`;
                const images = salon.salonImages?.length > 0 ? salon.salonImages : defaultImages;
                // const nextAvailable = getNextAvailableTime(salon.openTime, salon.breaks);
                const card = document.createElement('div');
                card.className = 'salon-card';
                card.innerHTML = `
                    <div class="slider" data-slider-id="${sliderId}">
                        <div class="slides">
                            ${images.map(() => `<div class="slide" style="background-image: url('${placeholderImage}')"></div>`).join('')}
                        </div>
                        <button class="slider-btn prev" onclick="moveSlide('${sliderId}', -1)">❮</button>
                        <button class="slider-btn next" onclick="moveSlide('${sliderId}', 1)">❯</button>
                    </div>
                    <h3>${salon.salonName}</h3>
                    <div class="details">
                        <p style="font-size: 90%; margin-bottom: -5px; margin-top: -8px;"><strong>Owner:</strong> ${salon.ownerName}</p>
                        <p style="font-size: 90%; margin-bottom: -5px; margin-top: 3px;"><strong>Opened:</strong> ${`${convertTo12HourFormat(salon.openTime) || 'N/A'} - ${convertTo12HourFormat(salon.closeTime) || 'N/A'}`}</p>
                        <p class="location" style="margin-left: 1px; margin-bottom: -5px; margin-top: 6px"><strong style="font-size: 90%;">Location:</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.location)}" target="_blank">${salon.location}</a></p>
                        </div>
                        <button class="btn" onclick="debounceShowSection('user-booking', '${salon.salonName}', '${salon.ownerName}', '${salon.location}')">Book Now</button>
                        `;
                        
                    // <p style="font-size: medium; margin-bottom: -5px; margin-top: 15px;"><strong>Next Available:</strong> ${nextAvailable}</p>
                grid.appendChild(card);
                initSlider(sliderId);
            }
        });

        // Lazy-load images with IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const index = Array.from(grid.children).indexOf(card);
                    const salon = salons[index];
                    const images = salon.salonImages?.length > 0 ? salon.salonImages : defaultImages;
                    loadImagesForCard(card, images);
                    observer.unobserve(card);
                }
            });
        }, { rootMargin: '100px' });

        grid.querySelectorAll('.salon-card').forEach(card => observer.observe(card));
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('Salon rendering aborted');
            return;
        }
        clearLoading();
        grid.innerHTML = '<p style="text-align: center; color: red;">Error loading salons. Please try again.</p>';
        console.error('Error rendering salons:', e);
    }
}

// Debounce utility to prevent rapid showSection calls
let lastSectionChange = 0;
function debounceShowSection(sectionId, ...args) {
    const now = Date.now();
    if (now - lastSectionChange < 100) return; // Skip if called within 100ms
    lastSectionChange = now;
    showSection(sectionId, ...args);
}

// Helper: Convert HH:MM AM/PM to minutes since midnight
function timeToMinutes(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

// Helper: Convert minutes since midnight to HH:MM AM/PM
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
}
// Section Toggling
async function showSection(sectionId, salonName, ownerName, location) {
    ['login-error', 'register-error', 'settings-error', 'booking-error', 'your_booking-error', 'dashboard-error', 'manual-dashboard-error'].forEach(clearError);
    // Abort any ongoing async operations
    if (currentAbortController) {
        currentAbortController.abort();
    }
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    // Clear dashboard reload interval when leaving your-salon
    if (dashboardReloadInterval && sectionId !== 'your-salon') {
        clearInterval(dashboardReloadInterval);
        dashboardReloadInterval = null;
    }

    // Check if the target section is already active
    const targetSection = document.getElementById(sectionId);
    if (targetSection && targetSection.classList.contains('active')) return;

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    if (!targetSection) return;
    targetSection.classList.add('active');
    const backBtn = document.getElementById('back-btn');
    if (sectionId === 'home') {
        backBtn.classList.remove('visible');
        await renderSalons(signal);
    } else {
        backBtn.classList.add('visible');
    }
    if (sectionId === 'your-salon') {
        // Set scroll flag for manual navigation
        shouldScrollOnDashboard = true;
        await showDashboard();
    } else if (sectionId === 'your-booked-salon') {
        // Fetch fresh bookings to ensure canceled bookings are excluded
        let bookings = await getData("bookings", { signal }) || [];
        const userBookings = bookings.filter(b => b.status === 'pending' && b.deviceId === deviceId);
        if (userBookings.length === 0) {
            const noBookingSection = document.getElementById('no-booking');
            if (noBookingSection) {
                noBookingSection.classList.add('active');
                document.getElementById('your-booked-salon').classList.remove('active');
            }
        } else {
            await renderUserBookings(userBookings);
        }
    } else if (sectionId === 'user-booking' && salonName) {
        document.getElementById('customer-name').value = "";
        document.getElementById('booking-salon-name').textContent = salonName;
        document.getElementById('booking-owner-name').innerHTML = `<strong>Owner:</strong> ${ownerName}`;
        document.getElementById('booking-location').innerHTML = `<strong>Location:</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}" target="_blank">${location}</a>`;
        
        
        const salon = salons.find(s => s.salonName === salonName);
        document.getElementById('booking-owner-number').innerHTML = `<strong>Owner Number:</strong> ${salon.ownerNumber}`;
        const serviceSelect = document.getElementById('booking-service');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">Select Service</option>';
            if (salon && salon.services) {
                salon.services.forEach(service => {
                    const option = document.createElement('option');
                    // Ensure defaults for discounts
                    const discountedPrice = service.discounted_price || 0;
                    const wholeDiscount = salon.WholeServiceDiscounting || 0;
                    let finalPrice = service.price;
                    let displayText = `${service.name} (PKR ${service.price}, ${service.time} min)`;

                    // Calculate effective discount
                    if (discountedPrice > 0 || wholeDiscount > 0) {
                        // Apply specific service discount if available
                        if (discountedPrice > 0) {
                            finalPrice = Math.min(finalPrice, discountedPrice);
                        }
                        // Apply whole-service discount if available
                        if (wholeDiscount > 0) {
                            finalPrice -= wholeDiscount;
                        }
                        // Ensure final price is non-negative and less than original
                        finalPrice = Math.max(0, Math.min(service.price, finalPrice));
                        // Only show discount if final price is less than original
                        if (finalPrice < service.price) {
                            displayText = `${service.name} (${service.price} rupee <Discounting you> ${finalPrice} rupee , ${service.time} min)`;
                        }
                    }
                    option.value = service.name + 'p' + finalPrice;
                    option.textContent = displayText;
                    serviceSelect.appendChild(option);
                });
            }
        }
        // const serviceSelect = document.getElementById('booking-service');
        // if (serviceSelect) {
        //     serviceSelect.innerHTML = '<option value="">Select Service</option>';
        //     if (salon && salon.services) {
        //         salon.services.forEach(service => {
        //             const option = document.createElement('option');
        //             option.value = service.name;
        //             if(service.discounted_price == 0 && salon.WholeServiceDiscounting == 0){

        //                 option.textContent = `${service.name} (PKR ${service.price} , ${service.time} , ${service.time} min)`;
        //             }
        //             else if(service.discounted_price > 0 && salon.WholeServiceDiscounting > 0){
                        
        //                 option.textContent = `${service.name} (PKR ${service.price} > ${service.discounted_price} >== ${service.discounted_price - salon.WholeServiceDiscounting} , ${service.time} , ${service.time} min)`;
        //             }
        //             option.textContent = `${service.name} (PKR ${service.price} > ${service.discounted_price} >== ${service.discounted_price - salon.WholeServiceDiscounting} , ${service.time} , ${service.time} min)`;
        //             serviceSelect.appendChild(option);
        //         });
        //     }
        // }
        document.getElementById('booking-salon-openedTime').innerHTML = `<strong>Opened:</strong> ${convertTo12HourFormat(salon.openTime) || 'N/A'} - ${convertTo12HourFormat(salon.closeTime) || 'N/A'}`;

        Init_UserBooking_Times();        
        
        const imageslider = document.getElementById('user-booking-images-slider');
        const placeholderImage = 'https://via.placeholder.com/150'; // Fallback image URL
        const images = salon.salonImages || []; // Fallback to empty array if images is undefined

        // Clear existing content and generate new slides
        imageslider.innerHTML = images.map(imageUrl => 
            `<div class="slide" style="background-image: url('${imageUrl || placeholderImage}')"></div>`
        ).join('');
        initSlider('booking-salon');
        
        /*
        const timeSelect = document.getElementById('booking-time');
        if (timeSelect) {
            timeSelect.innerHTML = '<option value="token">Token</option>';
            timeSelect.innerHTML = '';
            if (salon) {
                const nowTime = new Date();
                const start = new Date(`2000-01-01T${salon.openTime}`);
                const end = new Date(`2000-01-01T${salon.closeTime}`);
                const breaks = salon.breaks || [];
                while (start < end) {
                    const time = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const isBreak = breaks.some(b => {
                        const breakStart = new Date(`2000-01-01T${b.from}`);
                        const breakEnd = new Date(`2000-01-01T${b.to}`);
                        return start >= breakStart && start < breakEnd;
                    });
                    if (!isBreak) {
                        const option = document.createElement('option');
                        option.value = time;
                        option.textContent = time;
                        timeSelect.appendChild(option);
                    }
                    start.setMinutes(start.getMinutes() + 15);
                }
            }
        }
        */
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
///////////
async function Init_UserBooking_Times() {
    ////////////at in working so start
    const timeSelect = document.getElementById('booking-time');
    if (!timeSelect) return;

    const serviceSelected = document.getElementById('booking-service')?.value;
    const _salonName = document.getElementById('booking-salon-name')?.textContent?.trim();

    if (!serviceSelected || serviceSelected === "") {
        timeSelect.innerHTML = '<option value="" disabled selected>Please first Select Service</option>';
        timeSelect.disabled = true;
        return;
    }
    timeSelect.innerHTML = '';
    
    const signal = currentAbortController?.signal;
    const buffer_minute = 5;
    let salon = null;
    let user_choice_service = 0;

    // Find salon and service duration
    for (let _salon of salons) {
        if (_salon.salonName === _salonName) {
            salon = _salon;
            for (let salon_service of _salon.services) {
                if (salon_service.name === serviceSelected) {
                    user_choice_service = salon_service.time;
                    break;
                }
            }
            break;
        }
    }

    if (!salon) {
        timeSelect.innerHTML = '<option value="" disabled selected>Error: Salon not found</option>';
        return;
    }

    timeSelect.innerHTML = '<option value="" disabled selected>Loading available times...</option>';

    try {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes(); // 12:27 PM = 747 minutes
        const openMinutes = timeToMinutes(salon.openTime); // e.g., "09:00 AM" = 540
        const closeMinutes = timeToMinutes(salon.closeTime); // e.g., "10:00 PM" = 1320

        // Check if salon is closed
        if (currentMinutes >= closeMinutes) {
            timeSelect.innerHTML = '<option value="" disabled selected>SALON IS CLOSED</option>';
            return;
        }

        // Initialize time options
        timeSelect.innerHTML = '<option value="" disabled selected>All Available Times is Here</option>';

        // Start time: current time or open time, rounded to next 10-minute interval
        const round_minutes = 5;
        let startMinutes = Math.max(currentMinutes, openMinutes);
        startMinutes = Math.ceil(startMinutes / round_minutes) * round_minutes; // Rounds 12:27 PM to 12:30 PM

        const breaks = salon.breaks || [];
        const bookings = await getData("bookings", { signal }) || [];

        let hasAvailableSlots = false;

        while (startMinutes < closeMinutes) {
            const timeStr = minutesToTime(startMinutes);

            // Check if the time slot is during a break
            const isBreak = breaks.some(b => {
                const breakStart = timeToMinutes(b.from);
                const breakEnd = timeToMinutes(b.to);
                return startMinutes >= breakStart && startMinutes < breakEnd;
            });
            
            // New variable to track booked start times with buffer only
            let Booked_Count = 0;
            for (let _booking of bookings) {
                if (_booking.salonName === salon.salonName && _booking.status === 'pending') {
                    const bookingStart = timeToMinutes(_booking.time.substring(0, _booking.time.indexOf("s")));
                    const bookingEnd = bookingStart + _booking.time_take;

                    if (startMinutes >= bookingStart && startMinutes < bookingEnd + buffer_minute) {
                        Booked_Count++;
                    }
                }
            }
            // Check seat availability over the entire service duration
            const serviceEnd = startMinutes + user_choice_service;
            let isSlotAvailable = true;
            let maxBookedSeats = 0;

            for (let checkMinutes = startMinutes; checkMinutes < serviceEnd; checkMinutes++) {
                let bookedSeat = 0;
                for (let _booking of bookings) {
                    if (_booking.salonName === salon.salonName && _booking.status === 'pending') {
                        const bookingTimeStr = _booking.time.substring(0, _booking.time.indexOf("s"));
                        const bookingStart = timeToMinutes(bookingTimeStr);
                        const bookingEnd = bookingStart + _booking.time_take;
                        if (checkMinutes >= bookingStart && checkMinutes < bookingEnd + buffer_minute) {
                            bookedSeat += 1;
                        }
                    }
                }
                maxBookedSeats = Math.max(maxBookedSeats, bookedSeat);
                if (bookedSeat >= salon.SeatCount) {
                    isSlotAvailable = false;
                    break;
                }
            }

            // Check if the service duration fits within operating hours and breaks
            const fitsSchedule = serviceEnd <= closeMinutes &&
                !breaks.some(b => {
                    const breakStart = timeToMinutes(b.from);
                    const breakEnd = timeToMinutes(b.to);
                    return serviceEnd > breakStart && startMinutes < breakEnd;
                });

            if (!isBreak && isSlotAvailable && fitsSchedule && maxBookedSeats < salon.SeatCount && Booked_Count < salon.SeatCount) {
                const option = document.createElement('option');
                option.value = timeStr + "s" + (Booked_Count + 1);
                option.textContent = `${timeStr} : Seats (${Booked_Count}/${salon.SeatCount})`;
                timeSelect.appendChild(option);
                hasAvailableSlots = true;
            }

            startMinutes += 5; // Increment by 10 minutes
        }

        if (!hasAvailableSlots) {
            timeSelect.innerHTML = '<option value="" disabled selected>No available time slots</option>';
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('Error fetching bookings:', e);
            timeSelect.innerHTML = '<option value="" disabled selected>Error loading time slots</option>';
        }
    }
    timeSelect.disabled = false;
}
async function Init_ManualBooking_Times() {
    ////////////at in working so start
    const timeSelect = document.getElementById('manual-booking-time');
    if (!timeSelect) return;

    const time_take = document.getElementById('manualBooking-timeTake')?.value;
    
    if (!time_take || time_take === "") {
        timeSelect.innerHTML = '<option value="" disabled selected>Please first Enter Time take</option>';
        timeSelect.disabled = true;
        return;
    }

    const user_choice_service = parseInt(time_take);
    
    const your_salon = salon_Index >= 0 && salons[salon_Index] ? salons[salon_Index] : null;
    timeSelect.innerHTML = '';
    
    const signal = currentAbortController?.signal;
    const buffer_minute = 5;

    if (!your_salon) {
        timeSelect.innerHTML = '<option value="" disabled selected>Error: Salon not found</option>';
        return;
    }

    timeSelect.innerHTML = '<option value="" disabled selected>Loading available times...</option>';

    try {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes(); // 12:27 PM = 747 minutes
        const openMinutes = timeToMinutes(your_salon.openTime); // e.g., "09:00 AM" = 540
        const closeMinutes = timeToMinutes(your_salon.closeTime); // e.g., "10:00 PM" = 1320

        // Check if salon is closed
        if (currentMinutes >= closeMinutes) {
            timeSelect.innerHTML = '<option value="" disabled selected>SALON IS CLOSED</option>';
            return;
        }

        // Initialize time options
        timeSelect.innerHTML = '<option value="" disabled selected>All Available Times is Here</option>';

        // Start time: current time or open time, rounded to next 10-minute interval
        const round_num = 5;
        let startMinutes = Math.max(currentMinutes, openMinutes);
        startMinutes = Math.ceil(startMinutes / round_num) * round_num; // Rounds 12:27 PM to 12:30 PM

        const breaks = your_salon.breaks || [];
        const bookings = await getData("bookings", { signal }) || [];

        let hasAvailableSlots = false;

        while (startMinutes < closeMinutes) {
            const timeStr = minutesToTime(startMinutes);

            // Check if the time slot is during a break
            const isBreak = breaks.some(b => {
                const breakStart = timeToMinutes(b.from);
                const breakEnd = timeToMinutes(b.to);
                return startMinutes >= breakStart && startMinutes < breakEnd;
            });
            
            // New variable to track booked start times with buffer only
            let Booked_Count = 0;
            for (let _booking of bookings) {
                if (_booking.salonName === your_salon.salonName && _booking.status === 'pending') {
                    const bookingStart = timeToMinutes(_booking.time.substring(0, _booking.time.indexOf("s")));
                    const bookingEnd = bookingStart + _booking.time_take;

                    if (startMinutes >= bookingStart && startMinutes < bookingEnd + buffer_minute) {
                        Booked_Count++;
                    }
                }
            }
            // Check seat availability over the entire service duration
            const serviceEnd = startMinutes + user_choice_service;
            let isSlotAvailable = true;
            let maxBookedSeats = 0;

            for (let checkMinutes = startMinutes; checkMinutes < serviceEnd; checkMinutes++) {
                let bookedSeat = 0;
                for (let _booking of bookings) {
                    if (_booking.salonName === your_salon.salonName && _booking.status === 'pending') {
                        const bookingTimeStr = _booking.time.substring(0, _booking.time.indexOf("s"));
                        const bookingStart = timeToMinutes(bookingTimeStr);
                        const bookingEnd = bookingStart + _booking.time_take;
                        if (checkMinutes >= bookingStart && checkMinutes < bookingEnd + buffer_minute) {
                            bookedSeat += 1;
                        }
                    }
                }
                maxBookedSeats = Math.max(maxBookedSeats, bookedSeat);
                if (bookedSeat >= your_salon.SeatCount) {
                    isSlotAvailable = false;
                    break;
                }
            }

            // Check if the service duration fits within operating hours and breaks
            const fitsSchedule = serviceEnd <= closeMinutes &&
                !breaks.some(b => {
                    const breakStart = timeToMinutes(b.from);
                    const breakEnd = timeToMinutes(b.to);
                    return serviceEnd > breakStart && startMinutes < breakEnd;
                });

            if (!isBreak && isSlotAvailable && fitsSchedule && maxBookedSeats < your_salon.SeatCount) {
                const option = document.createElement('option');
                option.value = timeStr + "s" + (Booked_Count + 1);
                option.textContent = `${timeStr} : Seats (${Booked_Count}/${your_salon.SeatCount})`;
                timeSelect.appendChild(option);
                hasAvailableSlots = true;
            }

            startMinutes += 5; // Increment by 10 minutes
        }

        if (!hasAvailableSlots) {
            timeSelect.innerHTML = '<option value="" disabled selected>No available time slots</option>';
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('Error fetching bookings:', e);
            timeSelect.innerHTML = '<option value="" disabled selected>Error loading time slots</option>';
        }
    }
    timeSelect.disabled = false;
}
async function manualBook() {
    clearError('manual-dashboard-error');
    const time_take = document.getElementById('manualBooking-timeTake')?.value;
    const selected_time = document.getElementById('manual-booking-time')?.value;
    
    // Validate input
    if (!time_take) {
        setError("manual-dashboard-error" , 'Please enter how much time the service takes.');
        return;
    }
    
    const user_choice_service = parseInt(time_take);
    if (isNaN(user_choice_service) || user_choice_service <= 0) {
        setError("manual-dashboard-error" , 'Please enter a valid service duration.');
        return;
    }
    
    // Get salon data
    const salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    const your_salon = salon_Index >= 0 && salons[salon_Index] ? salons[salon_Index] : null;
    
    if (!your_salon) {
        setError("manual-dashboard-error" , 'No salon selected. Please select a salon first.');
        return;
    }
    let _time = "";
    if(selected_time && selected_time != ""){
        _time = selected_time;
    }
    else{
        setError("manual-dashboard-error" , 'Checking availability...');
        
        const signal = currentAbortController?.signal;
        const buffer_minute = 5;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes(); // e.g., 04:49 PM = 1009 minutes
        const openMinutes = timeToMinutes(your_salon.openTime); // e.g., "09:00 AM" = 540
        const closeMinutes = timeToMinutes(your_salon.closeTime); // e.g., "10:00 PM" = 1320

        // Check if salon is open
        if (currentMinutes < openMinutes) {
            setError("manual-dashboard-error" , 'Salon has not yet opened.');
            return;
        }
        if (currentMinutes >= closeMinutes) {
            setError("manual-dashboard-error" , 'Salon is closed at this time.');
            return;
        }

        // Use current time for booking
        const startMinutes = currentMinutes; // No rounding to keep it precise
        const timeStr = minutesToTime(startMinutes);

        // Check if the time slot is during a break
        const breaks = your_salon.breaks || [];
        const isBreak = breaks.some(b => {
            const breakStart = timeToMinutes(b.from);
            const breakEnd = timeToMinutes(b.to);
            return startMinutes >= breakStart && startMinutes < breakEnd;
        });

        if (isBreak) {
            const breakRange = breaks.find(b => {
                const breakStart = timeToMinutes(b.from);
                return startMinutes >= breakStart && startMinutes < timeToMinutes(b.to);
            });
            setError("manual-dashboard-error" , `Salon is on break from ${breakRange.from} to ${breakRange.to}.`);
            return;
        }

        // Check seat availability
        let bookings = await getData("bookings", { signal }) || [];
        let bookedSeat = 0;
        const serviceEnd = startMinutes + user_choice_service;

        for (let booking of bookings) {
            if (booking.salonName === your_salon.salonName && booking.status === 'pending') {
                const bookingStart = timeToMinutes(booking.time.substring(0, booking.time.indexOf("s")));
                const bookingEnd = bookingStart + booking.time_take;
                if (startMinutes >= bookingStart - buffer_minute && startMinutes < bookingEnd + buffer_minute) {
                    bookedSeat += 1;
                }
            }
        }

        if (bookedSeat >= your_salon.SeatCount) {
            setError("manual-dashboard-error" , 'Time slot is fully booked.');
            return;
        }

        // Check if the service duration fits
        const fitsSchedule = serviceEnd <= closeMinutes &&
            !breaks.some(b => {
                const breakStart = timeToMinutes(b.from);
                const breakEnd = timeToMinutes(b.to);
                return serviceEnd > breakStart && startMinutes < breakEnd;
            });
            // && !bookings.some(booking => {
            //     if (booking.salonName === your_salon.salonName && booking.status === 'pending') {
            //         const bookingStart = timeToMinutes(booking.time.substring(0, booking.time.indexOf("s")));
            //         const bookingEnd = bookingStart + booking.time_take;
            //         return serviceEnd > bookingStart - buffer_minute && startMinutes < bookingEnd + buffer_minute;
            //     }
            //     return false;
            // });

        if (!fitsSchedule) {
            setError("manual-dashboard-error" , 'Service duration overlaps with another booking or break. Please choose a shorter duration.');
            return;
        }
        _time = timeStr + "s" + (bookedSeat + 1)
    }

    // Create booking
    const booking = {
        salonName: your_salon.salonName,
        ownerName: your_salon.ownerName,
        location: your_salon.location,
        deviceId: 'manual',
        service: "Manual Booking",
        time: _time,
        time_take: user_choice_service,
        customerImage: '',
        customerName: 'Manual',
        customerNumber: "0000",
        code: 'BOOK' + Math.random().toString(36).substring(2, 8),
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
    };

    try {
        bookings.push(booking);
        await setData("bookings", bookings);
        setError('manual-dashboard-error', 'Manual booking confirmed!');
        showDashboard();
    } catch (e) {
        if (e.name !== 'AbortError') {
            setError('manual-dashboard-error', 'Failed to book appointment. Please try again.');
            console.error('Error booking appointment:', e);
        }
    }
}

function showForm(formId) {
    const forms = ['salon-login', 'salon-register', 'salon-dashboard', 'salon-settings'];
    forms.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = id === formId ? 'block' : 'none';
        }
    });
    if (formId === 'salon-settings' && salon_Index >= 0) {
        populateSettings();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mock Data
let deviceId = "";
let your_salon = null;
let salons = [];
let bookings = [];
let salon_Index = -1;

// Initialize Data (Reset)
async function resetData() {
    salons = [
        {
            ownerName: 'Ali Khan',
            salonName: 'Style Haven',
            password: 'password123',
            location: 'Karachi',
            openTime: '09:00',
            closeTime: '18:00',
            status: "Active",
            breaks: [{ from: '12:00', to: '13:00' }],
            services: [
                { name: 'Haircut', price: 1000, time: 30 },
                { name: 'Coloring', price: 3000, time: 60 }
            ],
            ownerImage: '',
            salonImages: defaultImages
        },
        {
            ownerName: 'Sara Ahmed',
            salonName: 'Elegance Salon',
            password: 'password123',
            location: 'Lahore',
            openTime: '10:00',
            closeTime: '19:00',
            status: "DeActive",
            breaks: [{ from: '13:00', to: '14:00' }],
            services: [
                { name: 'Haircut', price: 1200, time: 45 },
                { name: 'Manicure', price: 1500, time: 30 }
            ],
            ownerImage: '',
            salonImages: defaultImages
        }
    ];
    bookings = [];
    salon_Index = -1;
    try {
        await setData('salons', salons);
        await setData('bookings', bookings);
        localStorage.setItem('salon_Index', salon_Index);
    } catch (e) {
        console.error('Error saving to Firebase:', e);
    }
}

// Load Data
async function loadData() {
    // await resetData();
    try {
        deviceId = localStorage.getItem("Device_Id");
        if (!deviceId) {
            deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem("Device_Id", deviceId);
        }
        
        salons = await getData("salons");
        if (!salons || !Array.isArray(salons)) {
            // salons = [];
            console.warn('Salons data is empty or invalid, resetting to mock data');
            await resetData();
            salons = await getData("salons") || [];
        }
        bookings = await getData("bookings") || [];
        salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
        
        if (salon_Index >= 0 && salons[salon_Index]) {
            your_salon = salons[salon_Index];
        } else {
            salon_Index = -1;
            your_salon = null;
            localStorage.setItem('salon_Index', salon_Index);
        }
    } catch (e) {
        console.error('Error loading from Firebase:', e);
        await resetData();
        salons = await getData("salons") || [];
    }
}

// Validation Helpers
function validateTimeRange(from, to) {
    if (!from || !to) return false;
    return new Date(`2000-01-01T${from}`) < new Date(`2000-01-01T${to}`);
}

// Unified function to display or clear messages with animation
function displayMessage(elementId, message = '', type = 'error') {
    const element = document.getElementById(elementId);
    const isClearing = !message;

    // Log action for debugging
    console.debug(`${isClearing ? 'Clearing' : 'Setting'} ${type} message for ID "${elementId}"${message ? `: "${message}"` : ''}`);

    let targetElement = element;
    if (!element) {
        console.warn(`Element with ID "${elementId}" not found. Creating temporary container.`);
        // Create a temporary container if element is missing
        let container = document.getElementById(`temp-message-${elementId}`);
        if (!container) {
            container = document.createElement('div');
            container.id = `temp-message-${elementId}`;
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.zIndex = '1000';
            container.style.maxWidth = '300px';
            container.style.padding = '10px';
            container.style.borderRadius = '5px';
            container.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            container.setAttribute('role', 'alert');
            container.setAttribute('aria-live', 'assertive');
            document.body.appendChild(container);
        }
        targetElement = container;
    }

    // Reset element state
    targetElement.textContent = '';
    targetElement.className = 'message'; // Reset to base class
    targetElement.style.display = 'none';
    targetElement.style.opacity = '0';
    targetElement.style.transform = 'translateY(-20px)';
    targetElement.removeAttribute('aria-hidden');

    if (isClearing) {
        return; // Stop here for clearing
    }

    // Set message and styles
    targetElement.textContent = message;
    targetElement.classList.add(type === 'error' ? 'error-message' : 'success-message');
    targetElement.classList.add('slide-in');
    targetElement.style.display = 'block';
    targetElement.style.opacity = '1';
    targetElement.style.padding = '8px';
    targetElement.style.margin = '5px 0';
    targetElement.style.borderRadius = '4px';
    targetElement.style.color = type === 'error' ? '#721c24' : '#155724';
    targetElement.style.backgroundColor = type === 'error' ? '#f8d7da' : '#d4edda';
    targetElement.style.border = type === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
    targetElement.setAttribute('role', 'alert');
    targetElement.setAttribute('aria-live', 'assertive');

    // Ensure visibility by scrolling into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-clear all messages after 5 seconds with fade-out
    setTimeout(() => {
        if (targetElement.textContent === message) {
            targetElement.classList.remove('slide-in');
            targetElement.classList.add('fade-out');
            setTimeout(() => {
                if (targetElement.textContent === message) {
                    displayMessage(elementId); // Clear if message hasn't changed
                }
            }, 500); // Match fade-out duration
        }
    }, 5000);
}

// Clear error message for a given error element ID
function clearError(errorId) {
    displayMessage(errorId);
}

// Set error or success message for a given error element ID
function setError(errorId, message) {
    // Determine message type based on content (heuristic for backward compatibility)
    const isSuccess = message.toLowerCase().includes('success') || 
                     message.toLowerCase().includes('confirmed') || 
                     message.toLowerCase().includes('completed') || 
                     message.toLowerCase().includes('canceled');
    displayMessage(errorId, message, isSuccess ? 'success' : 'error');
}

// Login
async function loginSalon() {
    clearError('login-error');
    const salonName = document.getElementById('login-salon-name')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!salonName || !password) {
        setError('login-error', 'Please fill all required fields.');
        return;
    }
    
    salons = await getData("salons") || [];
    salon_Index = salons.findIndex(s => s.salonName === salonName && s.password === password);
    
    if (salon_Index >= 0) {
        your_salon = salons[salon_Index];
        localStorage.setItem('salon_Index', salon_Index);
        showDashboard();
    } else {
        salon_Index = -1;
        localStorage.setItem('salon_Index', salon_Index);
        setError('login-error', 'Invalid salon name or password.');
    }
}

// Register
async function registerSalon() {
    clearError('register-error');
    const per_code = document.getElementById('reg-permission-code')?.value.trim();
    if (!per_code) {
        setError('register-error', 'Please fill the Permission Code.');
        return;
    }
    let code = await getData("Permission Code");
    if (code != per_code) {
        setError('register-error', 'Incorrect Code.');
        return;
    }
    const ownerName = document.getElementById('reg-owner-name')?.value.trim();
    const ownerNumber = document.getElementById('reg-owner-number')?.value.trim();
    const salonName = document.getElementById('reg-salon-name')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const location = document.getElementById('reg-location')?.value.trim();
    const openTime = document.getElementById('reg-open-time')?.value;
    const closeTime = document.getElementById('reg-close-time')?.value;
    
    let WholeServiceDiscounting = document.getElementById('reg-service-all_Discounting')?.value;
    if(!WholeServiceDiscounting){
        WholeServiceDiscounting = 0;
    }

    if (!ownerName || !ownerNumber || !salonName || !password || !location || !openTime || !closeTime) {
        setError('register-error', 'Please fill all required fields.');
        return;
    }
    if (!isValidPakistaniPhoneNumber(ownerNumber)) {
        setError('register-error', 'Please enter a valid Pakistani phone number (e.g., 03001234567 or +923001234567).');
        return;
    }
    if (!validateTimeRange(openTime, closeTime)) {
        setError('register-error', 'Opening time must be before closing time.');
        return;
    }
    const breaks = Array.from(document.querySelectorAll('#break-list .list-item')).map(item => ({
        from: item.querySelector('.break-from')?.value,
        to: item.querySelector('.break-to')?.value
    })).filter(b => b.from && b.to && validateTimeRange(b.from, b.to));
    if (breaks.some(b => !validateTimeRange(b.from, b.to))) {
        setError('register-error', 'All break times must have valid from-to ranges.');
        return;
    }
    const services = Array.from(document.querySelectorAll('#service-list .list-item')).map(item => ({
        name: item.querySelector('.service-name')?.value.trim(),
        price: parseFloat(item.querySelector('.service-price')?.value) || 0,
        discounted_price: parseFloat(item.querySelector('.service-discounted-price')?.value) || 0,
        time: parseInt(item.querySelector('.service-time')?.value) || 0
    })).filter(s => s.name && s.price > 0 && s.time > 0);
    if (services.length === 0) {
        setError('register-error', 'At least one valid service is required.');
        return;
    }
    if(document.getElementById('reg-seatCount')?.value == ""){
        setError('register-error', 'Please fill all required fields.');
    }
    const seatCount = parseInt( document.getElementById('reg-seatCount')?.value );
    
    salons = await getData("salons") || [];
    if (salons.find(s => s.salonName === salonName)) {
        setError('register-error', 'Salon name already exists.');
        return;
    }
    const salon = {
        ownerName,
        ownerNumber,
        salonName,
        password,
        location,
        openTime,
        closeTime,
        SeatCount: seatCount,
        breaks,
        WholeServiceDiscounting,
        services,
        status: "Active",
        ownerImage: document.getElementById('reg-owner-image')?.files[0]?.name || '',
        salonImages: Array.from(document.getElementById('reg-salon-image')?.files || []).map(f => f.name).length > 0 ?
            Array.from(document.getElementById('reg-salon-image').files).map(f => f.name) : defaultImages
    };
    salons.push(salon);
    try {
        await setData("salons", salons);
        salon_Index = salons.length - 1;
        your_salon = salon;
        localStorage.setItem('salon_Index', salon_Index);
        setError('register-error', 'Salon registered successfully!');
        showDashboard();
    } catch (e) {
        setError('register-error', 'Failed to register salon. Please try again.');
        console.error('Error registering salon:', e);
    }
}

// Populate Settings
async function populateSettings() {
    clearError('settings-error');
    salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    if (salon_Index < 0 || !salons[salon_Index]) {
        setError('settings-error', 'No salon selected. Please log in.');
        return;
    }
    your_salon = salons[salon_Index];
    const setOwnerName = document.getElementById('set-owner-name');
    const setOwnerNumber = document.getElementById('set-owner-number');
    const setSalonName = document.getElementById('set-salon-name');
    const setPassword = document.getElementById('set-password');
    const setLocation = document.getElementById('set-location');
    const setOpenTime = document.getElementById('set-open-time');
    const setCloseTime = document.getElementById('set-close-time');
    const setSeatCount = document.getElementById('set-seatCount');
    
    const set_WholeServiceDiscounting = document.getElementById('set-service-all_Discounting');

    if (setOwnerName) setOwnerName.value = your_salon.ownerName || '';
    if (setOwnerNumber) setOwnerNumber.value = your_salon.ownerNumber || '';
    if (setSalonName) setSalonName.value = your_salon.salonName || '';
    if (setPassword) setPassword.value = your_salon.password || '';
    if (setLocation) setLocation.value = your_salon.location || '';
    if (setSeatCount) setSeatCount.value = your_salon.SeatCount || '';
    if (setOpenTime) setOpenTime.value = your_salon.openTime || '';
    if (setCloseTime) setCloseTime.value = your_salon.closeTime || '';
    if (set_WholeServiceDiscounting) set_WholeServiceDiscounting.value = your_salon.WholeServiceDiscounting || 0;
    const breakList = document.getElementById('set-break-list');
    if (breakList) {
        breakList.innerHTML = '<h3>Break Times</h3>';
        (your_salon.breaks || []).forEach(breakTime => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <label>Break Time Range</label>
                <input type="time" class="break-from" value="${breakTime.from}" placeholder="From">
                <input type="time" class="break-to" value="${breakTime.to}" placeholder="To">
                <button class="btn" onclick="removeListItem(this)">Remove</button>
            `;
            breakList.appendChild(item);
        });
    }
    const serviceList = document.getElementById('set-service-list');
    if (serviceList) {
        serviceList.innerHTML = '<h3>Services</h3>';
        (your_salon.services || []).forEach(service => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <label>Service Details</label>
                <input type="text" class="service-name" value="${service.name}" placeholder="Service Name">
                <input type="number" class="service-price" value="${service.price}" placeholder="Price (PKR)">
                <input type="number" class="service-discounted-price" value="${service.discounted_price}" placeholder="Discounted Price (PKR)">
                <input type="number" class="service-time" value="${service.time}" placeholder="Time (min)">
                <button class="btn" onclick="removeListItem(this)">Remove</button>
            `;
            serviceList.appendChild(item);
        });
    }
}

// Save Settings
async function saveSettings() {
    clearError('settings-error');
    salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    if (salon_Index < 0) {
        setError('settings-error', 'No salon selected. Please log in.');
        return;
    }
    const ownerName = document.getElementById('set-owner-name')?.value.trim();
    const ownerNumber = document.getElementById('set-owner-number')?.value.trim();
    const salonName = document.getElementById('set-salon-name')?.value.trim();
    const password = document.getElementById('set-password')?.value;
    const location = document.getElementById('set-location')?.value.trim();
    const setSeatCount = document.getElementById('set-seatCount')?.value;
    const openTime = document.getElementById('set-open-time')?.value;
    const closeTime = document.getElementById('set-close-time')?.value;
    
    let WholeServiceDiscounting = document.getElementById('set-service-all_Discounting')?.value;
    if(!WholeServiceDiscounting){
        WholeServiceDiscounting = 0;
    }

    if (!ownerName || !ownerNumber || !salonName || !password || !location || !setSeatCount || !openTime || !closeTime) {
        setError('settings-error', 'Please fill all required fields.');
        return;
    }
    if (!isValidPakistaniPhoneNumber(ownerNumber)) {
        setError('settings-error', 'Please enter a valid Pakistani phone number (e.g., 03001234567 or +923001234567).');
        return;
    }
    if (!validateTimeRange(openTime, closeTime)) {
        setError('settings-error', 'Opening time must be before closing time.');
        return;
    }
    const breaks = Array.from(document.querySelectorAll('#set-break-list .list-item')).map(item => ({
        from: item.querySelector('.break-from')?.value,
        to: item.querySelector('.break-to')?.value
    })).filter(b => b.from && b.to && validateTimeRange(b.from, b.to));
    if (breaks.some(b => !validateTimeRange(b.from, b.to))) {
        setError('settings-error', 'All break times must have valid from-to ranges.');
        return;
    }
    const services = Array.from(document.querySelectorAll('#set-service-list .list-item')).map(item => ({
        name: item.querySelector('.service-name')?.value.trim(),
        price: parseFloat(item.querySelector('.service-price')?.value) || 0,
        discounted_price: parseFloat(item.querySelector('.service-discounted-price')?.value) || 0,
        time: parseInt(item.querySelector('.service-time')?.value) || 0
    })).filter(s => s.name && s.price > 0 && s.time > 0);
    if (services.length === 0) {
        setError('settings-error', 'At least one valid service is required.');
        return;
    }
    const updatedSalon = {
        ownerName,
        ownerNumber,
        salonName,
        password,
        location,
        openTime,
        closeTime,
        WholeServiceDiscounting,
        SeatCount : setSeatCount,
        breaks,
        services,
        status:"Active",
        ownerImage: document.getElementById('set-owner-image')?.files[0]?.name || your_salon.ownerImage,
        salonImages: document.getElementById('set-salon-image')?.files.length > 0 ? 
            Array.from(document.getElementById('set-salon-image').files).map(f => f.name) : 
            your_salon.salonImages
    };
    
    try {
        salons[salon_Index] = updatedSalon;
        await setData("salons", salons);
        your_salon = updatedSalon;
        setError('settings-error', 'Settings saved successfully!');
        showDashboard();
    } catch (e) {
        setError('settings-error', 'Failed to save settings. Please try again.');
        console.error('Error saving settings:', e);
    }
}

// Add/Remove List Items (Breaks and Services)
function addBreakTime(listId = 'break-list') {
    const breakList = document.getElementById(listId);
    if (!breakList) return;
    const newBreak = document.createElement('div');
    newBreak.className = 'list-item';
    newBreak.innerHTML = `
        <label>Break Time Range</label>
        <input type="time" class="break-from" placeholder="From">
        <input type="time" class="break-to" placeholder="To">
        <button class="btn" onclick="removeListItem(this)">Remove</button>
    `;
    breakList.appendChild(newBreak);
}

function addService(listId = 'service-list') {
    const serviceList = document.getElementById(listId);
    if (!serviceList) return;
    const newService = document.createElement('div');
    newService.className = 'list-item';
    newService.innerHTML = `
        <label>Service Details</label>
        <input type="text" class="service-name" placeholder="Service Name">
        <input type="number" class="service-price" placeholder="Price (PKR)">
        <input type="number" class="service-discounted-price" placeholder="Discounted Price (PKR)">
        <input type="number" class="service-time" placeholder="Time (min)">
        <button class="btn" onclick="removeListItem(this)">Remove</button>
    `;
    serviceList.appendChild(newService);
}

function removeListItem(button) {
    if (button.parentElement) {
        button.parentElement.remove();
    }
}
function convertTo12HourFormat(time24) {
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    
    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${hour}:${minute} ${ampm}`;
}

// Show Dashboard
async function showDashboard() {
    salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    if (salon_Index >= 0 && salons[salon_Index]) {
        your_salon = salons[salon_Index];
        bookings = await getData("bookings") || [];
        debounceShowSection('your-salon');
        showForm('salon-dashboard');

        const dashSalonName = document.getElementById('dash-salon-name');
        const dashOwnerName = document.getElementById('dash-owner-name');
        const dashOwnerNumber = document.getElementById('dash-owner-number');
        const dashLocation = document.getElementById('dash-location');
        const dashHours = document.getElementById('dash-hours');
        const dashBreaks = document.getElementById('dash-breaks');
        const dashServices = document.getElementById('dash-services');
        const dashWholeDiscountingServices = document.getElementById('dash-wholeDiscounting-services');
        if (dashSalonName) dashSalonName.textContent = your_salon.salonName || 'N/A';
        if (dashOwnerName) dashOwnerName.textContent = your_salon.ownerName || 'N/A';
        if (dashOwnerNumber) dashOwnerNumber.textContent = your_salon.ownerNumber || 'N/A';
        if (dashLocation) dashLocation.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(your_salon.location)}" target="_blank">${your_salon.location || 'N/A'}</a>`;
        if (dashHours) dashHours.textContent = `${convertTo12HourFormat(your_salon.openTime) || 'N/A'} - ${convertTo12HourFormat(your_salon.closeTime) || 'N/A'}`;
        if (dashBreaks) dashBreaks.textContent = your_salon.breaks?.length > 0 ? your_salon.breaks.map(b => `${b.from} - ${b.to}`).join(', ') : 'None';
        if (dashServices) dashServices.textContent = your_salon.services?.length > 0 ? your_salon.services.map(s => s.name).join(', ') : 'None';
        if (dashWholeDiscountingServices) dashWholeDiscountingServices.textContent = your_salon.WholeServiceDiscounting + " rupee" || 'N/A';

        const pending = bookings.filter(b => b.status === 'pending' && b.salonName === your_salon.salonName);
        const completed = bookings.filter(b => b.status === 'completed' && b.salonName === your_salon.salonName);
        const canceled = bookings.filter(b => b.status === 'user canceled' || b.status === 'dash canceled' && b.salonName === your_salon.salonName);

        const totalBookings = document.getElementById('total-bookings');
        const pendingBookings = document.getElementById('pending-bookings');
        if (totalBookings) totalBookings.textContent = completed.length;
        if (pendingBookings) pendingBookings.textContent = pending.length;
        Init_ManualBooking_Times();
        
        renderBookings(pending, 'pending-bookings-grid');
        renderBookings(completed, 'completed-bookings-grid');
        renderBookings(canceled, 'canceled-bookings-grid');

        const imageslider = document.getElementById('dash-slide-images');
        const placeholderImage = 'https://via.placeholder.com/150'; // Fallback image URL
        const images = your_salon.salonImages || []; // Fallback to empty array if images is undefined
        console.log("salonImages: "+ images.length)
        // Clear existing content and generate new slides
        imageslider.innerHTML = images.map(imageUrl => 
            `<div class="slide" style="background-image: url('${imageUrl || placeholderImage}')"></div>`
        ).join('');
        initSlider('dash-salon');

        // Start 10-second auto-reload for dashboard if logged in
        if (!dashboardReloadInterval) {
            dashboardReloadInterval = setInterval(async () => {
                if (salon_Index >= 0 && salons[salon_Index] && document.getElementById('your-salon').classList.contains('active')) {
                    shouldScrollOnDashboard = false; // Prevent scroll on auto-reload
                    your_salon = salons[salon_Index];
                    bookings = await getData("bookings") || [];

                    // Update dashboard data only
                    if (dashSalonName) dashSalonName.textContent = your_salon.salonName || 'N/A';
                    if (dashOwnerName) dashOwnerName.textContent = your_salon.ownerName || 'N/A';
                    if (dashOwnerNumber) dashOwnerNumber.textContent = your_salon.ownerNumber || 'N/A';
                    if (dashLocation) dashLocation.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(your_salon.location)}" target="_blank">${your_salon.location || 'N/A'}</a>`;
                    if (dashHours) dashHours.textContent = `${convertTo12HourFormat(your_salon.openTime) || 'N/A'} - ${convertTo12HourFormat(your_salon.closeTime) || 'N/A'}`;
                    if (dashBreaks) dashBreaks.textContent = your_salon.breaks?.length > 0 ? your_salon.breaks.map(b => `${b.from} - ${b.to}`).join(', ') : 'None';
                    if (dashServices) dashServices.textContent = your_salon.services?.length > 0 ? your_salon.services.map(s => s.name).join(', ') : 'None';

                    const pending = bookings.filter(b => b.status === 'pending' && b.salonName === your_salon.salonName);
                    const completed = bookings.filter(b => b.status === 'completed' && b.salonName === your_salon.salonName);
                    const canceled = bookings.filter(b => b.status === 'user canceled' || b.status === 'dash canceled' && b.salonName === your_salon.salonName);

                    if (totalBookings) totalBookings.textContent = completed.length;
                    if (pendingBookings) pendingBookings.textContent = pending.length;

                    renderBookings(pending, 'pending-bookings-grid');
                    renderBookings(completed, 'completed-bookings-grid');
                    renderBookings(canceled, 'canceled-bookings-grid');
                }
            }, 10000);
        }

        // Scroll to top only if manually navigated
        if (shouldScrollOnDashboard) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else {
        // Clear interval if user is not logged in
        if (dashboardReloadInterval) {
            clearInterval(dashboardReloadInterval);
            dashboardReloadInterval = null;
        }
        debounceShowSection('your-salon');
        showForm('salon-login');
    }
}
function renderBookings(bookings, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const clearLoading = showLoadingAnimation(grid);
    try {
        clearLoading();
        grid.innerHTML = '';

        // Get current time in minutes since midnight
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes(); // e.g., 05:10 PM = 1010 minutes

        // Sort bookings by closeness to current time
        const sortedBookings = bookings.sort((a, b) => {
            const timeA = timeToMinutes( a.time.substring(0, a.time.indexOf("s")));
            const timeB = timeToMinutes( b.time.substring(0, b.time.indexOf("s")));
            return Math.abs(timeA - currentMinutes) - Math.abs(timeB - currentMinutes);
        });

        let index = 0;
        sortedBookings.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'booking-card';
            // ${booking.status === 'pending' && index === 0 ? "<h4>Your Next Customer</h4><hr>" : ""}
            card.innerHTML = `
                ${booking.status === 'user canceled' ? `<strong>Canceled by User</strong>` : ""}
                <p><strong>Name:</strong> ${booking.customerName}</p>
                <p><strong>Number:</strong> ${booking.customerNumber}</p>
                <p><strong>Service:</strong> ${booking.service}</p>
                <p><strong>Price:</strong> ${booking.price}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time.substring(0, booking.time.indexOf("s"))} - ${minutesToTime(timeToMinutes(booking.time) + booking.time_take)}</p>
                <p><strong>Time Taken:</strong> ${booking.time_take}</p>
                <p><strong>Code:</strong> ${booking.code}</p>
                <p><strong>Seat:</strong> ${booking.time.substring(booking.time.indexOf("s") + 1)}</p>
                ${booking.status === 'pending' ? `<button class="btn" onclick="dash_cancelBooking('${booking.code}')">Cancel This Booking</button>
                <button class="btn" onclick="dash_Complete_Customer('${booking.code}')">Complete This Booking</button>` : ``}
            `;
            
            grid.appendChild(card);
            index += 1;
        });
    } catch (e) {
        clearLoading();
        grid.innerHTML = '<p style="text-align: center; color: red;">Error loading bookings. Please try again.</p>';
        console.error('Error rendering bookings:', e);
    }
}

// Render User Bookings (for Your Booked Salon)
async function renderUserBookings(bookings) {
    const grid = document.getElementById('bookings-grid');
    if (!grid) return;
    const clearLoading = showLoadingAnimation(grid);
    try {
        const userBookings = bookings.filter(booking => booking.deviceId === deviceId);
        clearLoading();
        grid.innerHTML = '';
        const groupedBookings = userBookings.reduce((acc, booking) => {
            if (!acc[booking.salonName]) {
                acc[booking.salonName] = {
                    ownerName: booking.ownerName,
                    location: booking.location,
                    bookings: []
                };
            }
            acc[booking.salonName].bookings.push(booking);
            return acc;
        }, {});
        Object.keys(groupedBookings).forEach((salonName, index) => {
            const { ownerName, location, bookings: salonBookings } = groupedBookings[salonName];
            const sliderId = `booked-salon-${salonName}-${index}`;
            const card = document.createElement('div');
            card.className = 'booking-card';
            const bookingDetails = salonBookings.map((booking, idx) =>  `
                ${booking.status == "pending" ? `
                    <div class="bookedSalon_userCard">
                    <h3 style="margin-left: 10px;">Booking ${idx + 1}:</h3>
                    <hr>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Name:</strong> ${booking.customerName}</p>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Phone Number:</strong> ${booking.customerNumber}</p>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Service:</strong> ${booking.service}</p>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Price:</strong> ${booking.price}</p>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Time Taken:</strong> ${booking.time_take} </p>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Time:</strong> ${booking.time.substring(0, booking.time.indexOf("s"))} - ${minutesToTime(timeToMinutes(booking.time) + booking.time_take)} </p>
                    <p style="margin-left: 10px;  font-size: 80%;"> <strong>Seat:</strong> ${booking.time.substring(booking.time.indexOf("s") + 1)}</p>
                    <button class="btn" onclick="cancelBooking('${booking.code}')">Cancel This Booking</button>
                </div>
                <br>`
                 : ''}
            `).join('');
            card.innerHTML = `
                <p style="text-align: left; font-size: large; text-shadow: #111827;">${salonBookings.length > 1 ? '<strong>Bookings for</strong>' : ''}<b>${salonName}</b></p>
                <div class="slider" data-slider-id="${sliderId}">
                    <div class="slides">
                        <div class="slide" style="background-image: url('${placeholderImage}')"></div>
                        <div class="slide" style="background-image: url('${placeholderImage}')"></div>
                        <div class="slide" style="background-image: url('${placeholderImage}')"></div>
                    </div>
                    <button class="slider-btn prev" onclick="moveSlide('${sliderId}', -1)">❮</button>
                    <button class="slider-btn next" onclick="moveSlide('${sliderId}', 1)">❯</button>
                </div>
                <p style="font-size: 85%;"><strong>Owner:</strong> ${ownerName}</p>
                <p style="font-size: 85%;"><strong>Location:</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}" target="_blank">${location}</a></p>
                <hr>
                <br>
                ${bookingDetails}
            `;
            grid.appendChild(card);
            initSlider(sliderId);
            // Lazy-load images for booked salon cards
            loadImagesForCard(card, defaultImages);
        });
    } catch (e) {
        clearLoading();
        grid.innerHTML = '<p style="text-align: center; color: red;">Error loading bookings. Please try again.</p>';
        console.error('Error rendering user bookings:', e);
    }
}

// Book Appointment
async function bookAppointment() {
    clearError('booking-error');
    const _service = document.getElementById('booking-service')?.value;
    const time = document.getElementById('booking-time')?.value;
    const customerName = document.getElementById('customer-name')?.value.trim();
    const customerNumber = document.getElementById('customer-number')?.value.trim();
    const _salonName = document.getElementById('booking-salon-name')?.textContent || '';
    if (!customerName) {
        setError('booking-error', 'Please add your Name.');
        return;
    }
    if (!customerNumber) {
        setError('booking-error', 'Please add your Phone Number.');
        return;
    }
    if (!isValidPakistaniPhoneNumber(customerNumber)) {
        setError('booking-error', 'Please enter a valid Pakistani phone number (e.g., 03001234567 or +923001234567).');
        return;
    }
    if (!_service || _service.value == "") {
        setError('booking-error', 'Please select a service.');
        return;
    }

    //service name
    const service = _service.substring(0, _service.indexOf("p"));
    //service price
    const price = _service.substring(_service.indexOf("p") + 1);

    let time_take = 0;
    for (let salon of salons) {
        if (salon.salonName === _salonName) {
            for (let salon_service of salon.services) {
                if (salon_service.name === service) {
                    time_take = salon_service.time;
                    break;
                }
            }
            break;
        }
    }


    const booking = {
        salonName: _salonName,
        ownerName: document.getElementById('booking-owner-name')?.textContent.replace('Owner: ', '') || '',
        location: document.getElementById('booking-location')?.textContent || '',
        deviceId: localStorage.getItem("Device_Id") || '',
        service ,
        price ,
        time,
        time_take,
        token: time === 'token' ? 'T' + Math.random().toString(36).substring(2, 8) : null,
        customerImage: '',
        customerName: customerName || 'User_' + Math.random().toString(36).substring(2, 8),
        customerNumber: customerNumber,
        code: 'BOOK' + Math.random().toString(36).substring(2, 8),
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
    };
    bookings = await getData("bookings") || [];
    bookings.push(booking);
    try {
        clearError('your_booking-error')
        await setData("bookings", bookings);
        setError('your_booking-error', 'Booking confirmed!');
        showSection('your-booked-salon')
        // showDashboard(); 
    } catch (e) {
        setError('booking-error', 'Failed to book appointment. Please try again.');
        console.error('Error booking appointment:', e);
    }
}

// Cancel Booking as User
async function cancelBooking(code) {
    clearError('your_booking-error');
    setError('your_booking-error', 'Canceling booking...');
    try {
        bookings = await getData("bookings") || [];
        const bookingIndex = bookings.findIndex(b => b.code === code && b.deviceId === deviceId);
        if (bookingIndex === -1) {
            setError('your_booking-error', 'Booking not found or already canceled.');
            return;
        }
        bookings[bookingIndex].status = "user canceled";
        await setData("bookings", bookings);
        setError('your_booking-error', 'Booking canceled successfully.');
        // Refresh the bookings view
        const userBookings = bookings.filter(b => b.status === 'pending' && b.deviceId === deviceId);
        if (userBookings.length === 0) {
            const noBookingSection = document.getElementById('no-booking');
            if (noBookingSection) {
                noBookingSection.classList.add('active');
                document.getElementById('your-booked-salon').classList.remove('active');
            }
        } else {
            await renderUserBookings(userBookings);
        }
    } catch (e) {
        setError('your_booking-error', 'Failed to cancel booking. Please try again.');
        console.error('Error canceling booking:', e);
    }
}
async function dash_cancelBooking(code) {
    clearError('dashboard-error');
    setError('dashboard-error', 'Canceling booking...');
    const salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    if (salon_Index < 0) {
        setError('dashboard-error', 'Please log in to manage bookings.');
        return;
    }
    bookings = await getData("bookings") || [];
    
    const bookingIndex = bookings.findIndex(b => b.code === code);
    if (bookingIndex === -1) {
        setError('dashboard-error', 'Booking not found or already canceled.');
        return;
    }
    if (bookingIndex >= 0) {
        bookings[bookingIndex].status = 'dash canceled';
        try {
            await setData("bookings", bookings);
            setError('dashboard-error', 'Set to Canceled.');
            showDashboard();
        } catch (e) {
            setError('dashboard-error', 'Failed to update booking status. Please try again.');
            console.error('Error updating booking status:', e);
        }
    } else {
        setError('dashboard-error', 'No pending bookings at or before the current time.');
    }
}
async function dash_Complete_Customer(code) {
    clearError('dashboard-error');
    const salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    if (salon_Index < 0) {
        setError('dashboard-error', 'Please log in to manage bookings.');
        return;
    }
    bookings = await getData("bookings") || [];
    
    const bookingIndex = bookings.findIndex(b => b.code === code);
    if (bookingIndex === -1) {
        setError('dashboard-error', 'Pending Booking not found or already Complete.');
        return;
    }
    if (bookingIndex >= 0) {
        bookings[bookingIndex].status = 'completed';
        try {
            await setData("bookings", bookings);
            setError('dashboard-error', 'Set to Completed.');
            showDashboard();
        } catch (e) {
            setError('dashboard-error', 'Failed to update booking status. Please try again.');
            console.error('Error updating booking status:', e);
        }
    } else {
        setError('dashboard-error', 'No pending bookings at or before the current time.');
    }
}
/////
// Manual Book, Next Customer, Cancel All
// async function Complete_Currect_Customer() {
//     const salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
//     if (salon_Index < 0) {
//         setError('dashboard-error', 'Please log in to manage bookings.');
//         return;
//     }
//     const bookings = await getData("bookings") || [];
//     const now = new Date();
//     const currentMinutes = now.getHours() * 60 + now.getMinutes(); // e.g., 05:29 PM = 1049 minutes

//     // Find the first pending booking for the current salon at or before the current time
//     const currentBookingIndex = bookings.findIndex(b => 
//         b.status === 'pending' && 
//         b.salonName === your_salon.salonName && 
//         timeToMinutes(b.time) <= currentMinutes
//     );

//     if (currentBookingIndex >= 0) {
//         bookings[currentBookingIndex].status = 'completed';
//         try {
//             await setData("bookings", bookings);
//             setError('dashboard-error', 'Set to Completed.');
//             showDashboard();
//         } catch (e) {
//             setError('dashboard-error', 'Failed to update booking status. Please try again.');
//             console.error('Error updating booking status:', e);
//         }
//     } else {
//         setError('dashboard-error', 'No pending bookings at or before the current time.');
//     }
// }
// async function Cancel_Currect_Customer() {
//     const salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
//     if (salon_Index < 0) {
//         setError('dashboard-error', 'Please log in to manage bookings.');
//         return;
//     }
//     const bookings = await getData("bookings") || [];
//     const now = new Date();
//     const currentMinutes = now.getHours() * 60 + now.getMinutes(); // e.g., 05:29 PM = 1049 minutes

//     // Find the first pending booking for the current salon at or before the current time
//     const currentBookingIndex = bookings.findIndex(b => 
//         b.status === 'pending' && 
//         b.salonName === your_salon.salonName && 
//         timeToMinutes(b.time) <= currentMinutes
//     );

//     if (currentBookingIndex >= 0) {
//         bookings[currentBookingIndex].status = 'canceled';
//         try {
//             await setData("bookings", bookings);
//             setError('dashboard-error', 'Set to Completed.');
//             showDashboard();
//         } catch (e) {
//             setError('dashboard-error', 'Failed to update booking status. Please try again.');
//             console.error('Error updating booking status:', e);
//         }
//     } else {
//         setError('dashboard-error', 'No pending bookings at or before the current time.');
//     }
// }

async function cancelAllBookings() {
    clearError('dashboard-error');
    const salon_Index = parseInt(localStorage.getItem('salon_Index')) || -1;
    if (salon_Index < 0) {
        setError('dashboard-error', 'Please log in to manage bookings.');
        return;
    }
    setError('dashboard-error', 'Canceling booking...');

    bookings = await getData("bookings") || [];
    
    let can = 0;
    for (let b = 0; b < bookings.length; b++) {
        
        if (bookings[b].salonName != your_salon.salonName) {
            continue;
        }
        if (bookings[b].status == "pending") {
            bookings[b].status = 'dash canceled';
            can += 1;
        }
    }
    if(can > 0){
        try {
            await setData("bookings", bookings);
            setError('dashboard-error', 'Canceled all '+can+` Bookings.`);
            showDashboard();
        } catch (e) {
            setError('dashboard-error', 'Failed to update booking status. Please try again.');
            console.error('Error updating booking status:', e);
        }
    }else{
        setError('dashboard-error', 'Booking not found or already canceled.');
    }
}

// Initialize
async function init() {
    const grid = document.getElementById('salon-grid');
    const clearLoading = grid ? showLoadingAnimation(grid) : () => {};
    try {
        await loadData();
        currentAbortController = new AbortController();
        await renderSalons(currentAbortController.signal);
        // Ensure salons render on slow networks by re-rendering after a delay
        setTimeout(async () => {
            if (grid && (!grid.children.length || grid.innerHTML.includes('No salons available'))) {
                console.log('Retrying salon render after delay');
                await renderSalons(currentAbortController.signal);
            }
        }, 500);
        debounceShowSection('home');
    } catch (e) {
        console.error('Error in init:', e);
        grid.innerHTML = '<p style="text-align: center; color: red;">Error loading page. Please refresh.</p>';
    } finally {
        clearLoading();
    }
}

// Run initialization
init();

// Initialize listener directly (safe way)
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('booking-service')?.addEventListener('change', Init_UserBooking_Times);
  document.getElementById('manualBooking-timeTake')?.addEventListener('input', Init_ManualBooking_Times);
});