document.addEventListener('DOMContentLoaded', () => {
    const calendarContainer = document.getElementById('calendar-container');
    const year = 2026;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // 2026 South Korean Public Holidays
    const holidays2026 = {
        '1-1': '신정',
        '2-16': '설날',
        '2-17': '설날',
        '2-18': '설날',
        '3-1': '삼일절',
        '3-2': '대체공휴일',
        '5-5': '어린이날',
        '5-24': '부처님 오신 날',
        '5-25': '대체공휴일',
        '6-3': '지방선거',
        '6-6': '현충일',
        '7-17': '제헌절',
        '8-15': '광복절',
        '8-17': '대체공휴일',
        '9-24': '추석',
        '9-25': '추석',
        '9-26': '추석',
        '9-28': '대체공휴일',
        '10-3': '개천절',
        '10-5': '대체공휴일',
        '10-9': '한글날',
        '12-25': '성탄절'
    };

    // Load saved selections from localStorage
    let savedSelections = JSON.parse(localStorage.getItem('vacationDates')) || {};

    // Migration for old array format
    if (Array.isArray(savedSelections)) {
        const newObj = {};
        savedSelections.forEach(date => newObj[date] = 'vacation');
        savedSelections = newObj;
    }

    function updateStorage() {
        localStorage.setItem('vacationDates', JSON.stringify(savedSelections));
    }

    function refreshAllCellTexts() {
        const selections = Object.entries(savedSelections);
        
        const dateSorter = (a, b) => {
            const [yA, mA, dA] = a.split('-').map(Number);
            const [yB, mB, dB] = b.split('-').map(Number);
            return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
        };

        const vacationDates = selections
            .filter(([_, type]) => type === 'vacation')
            .map(([date, _]) => date)
            .sort(dateSorter);

        const sickDates = selections
            .filter(([_, type]) => type === 'sick')
            .map(([date, _]) => date)
            .sort(dateSorter);

        document.querySelectorAll('.calendar td').forEach(cell => {
            const dateStr = cell.getAttribute('data-date');
            if (dateStr) {
                const originalDate = dateStr.split('-')[2];
                cell.classList.remove('selected', 'sick');
                
                if (savedSelections[dateStr] === 'vacation') {
                    const index = vacationDates.indexOf(dateStr);
                    cell.innerHTML = '연차<br>' + (index + 1);
                    cell.classList.add('selected');
                } else if (savedSelections[dateStr] === 'sick') {
                    const index = sickDates.indexOf(dateStr);
                    cell.innerHTML = '병가<br>' + (index + 1);
                    cell.classList.add('sick');
                } else {
                    cell.textContent = originalDate;
                }
            }
        });
    }

    for (let month = 0; month < 12; month++) {
        // Define which dates to show in this month
        const datesToShow = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let startDay = 1;
        let endDay = daysInMonth;

        // Exceptions: Move May 31 to June, Aug 30-31 to Sept
        if (month === 4) endDay = 30; // May: 1-30
        if (month === 5) datesToShow.push({ y: year, m: 5, d: 31 }); // June: starts with May 31
        
        if (month === 7) endDay = 29; // August: 1-29
        if (month === 8) { // September: starts with Aug 30, 31
            datesToShow.push({ y: year, m: 8, d: 30 });
            datesToShow.push({ y: year, m: 8, d: 31 });
        }

        for (let d = startDay; d <= endDay; d++) {
            datesToShow.push({ y: year, m: month + 1, d: d });
        }

        const monthWrapper = document.createElement('div');
        monthWrapper.classList.add('month-wrapper');

        const monthHeader = document.createElement('div');
        monthHeader.classList.add('month-header');

        const monthTitle = document.createElement('h2');
        monthTitle.textContent = monthNames[month];
        monthHeader.appendChild(monthTitle);

        const resetBtn = document.createElement('button');
        resetBtn.classList.add('month-reset-btn');
        resetBtn.innerHTML = '&#8634;';
        resetBtn.title = '초기화';
        resetBtn.addEventListener('click', () => {
            datesToShow.forEach(dateObj => {
                const dateStr = `${dateObj.y}-${dateObj.m}-${dateObj.d}`;
                delete savedSelections[dateStr];
            });
            updateStorage();
            refreshAllCellTexts();
        });
        monthHeader.appendChild(resetBtn);
        monthWrapper.appendChild(monthHeader);

        const calendar = document.createElement('table');
        calendar.classList.add('calendar');
        const header = calendar.createTHead();
        const headerRow = header.insertRow();
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const cell = document.createElement('th');
            cell.textContent = day;
            headerRow.appendChild(cell);
        });

        const tbody = calendar.createTBody();
        const firstDay = new Date(datesToShow[0].y, datesToShow[0].m - 1, datesToShow[0].d).getDay();

        let dateIdx = 0;
        for (let i = 0; i < 6; i++) {
            const row = tbody.insertRow();
            for (let j = 0; j < 7; j++) {
                const cell = row.insertCell();
                if (i === 0 && j < firstDay) {
                    // Empty cells
                } else if (dateIdx >= datesToShow.length) {
                    // No more dates
                } else {
                    const dateObj = datesToShow[dateIdx];
                    const currentDateStr = `${dateObj.y}-${dateObj.m}-${dateObj.d}`;
                    cell.setAttribute('data-date', currentDateStr);
                    
                    const holidayKey = `${dateObj.m}-${dateObj.d}`;
                    if (holidays2026[holidayKey]) {
                        cell.classList.add('holiday');
                        cell.title = holidays2026[holidayKey];
                    }

                    if (j === 0 || j === 6) {
                        cell.classList.add('weekend');
                    }

                    cell.textContent = dateObj.d;
                    
                    cell.addEventListener('click', () => {
                        const currentStatus = savedSelections[currentDateStr];
                        const selections = Object.entries(savedSelections);
                        const vacationCount = selections.filter(([_, type]) => type === 'vacation').length;
                        const sickCount = selections.filter(([_, type]) => type === 'sick').length;

                        if (!currentStatus) {
                            if (vacationCount < 15) {
                                savedSelections[currentDateStr] = 'vacation';
                            } else if (sickCount < 5) {
                                savedSelections[currentDateStr] = 'sick';
                            }
                        } else if (currentStatus === 'vacation') {
                            if (sickCount < 5) {
                                savedSelections[currentDateStr] = 'sick';
                            } else {
                                delete savedSelections[currentDateStr];
                            }
                        } else {
                            // Already sick, click to clear
                            delete savedSelections[currentDateStr];
                        }
                        
                        updateStorage();
                        refreshAllCellTexts();
                    });
                    dateIdx++;
                }
            }
            if (dateIdx >= datesToShow.length) break;
        }
        monthWrapper.appendChild(calendar);
        calendarContainer.appendChild(monthWrapper);
    }
    refreshAllCellTexts();
});