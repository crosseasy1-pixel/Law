// ==========================================
// 🧠 ส่วนประกาศตัวแปรหลัก (State Variables)
// ==========================================
let activeExamSet = null;    // เก็บชุดข้อสอบที่กำลังเล่นอยู่ (เช่น ชุดที่ 1 หรือ 2)
let currentQuestions = [];   // เก็บรายการโจทย์ที่ผ่านการกรอง/สุ่มแล้ว เตรียมนำมาแสดง
let currentIndex = 0;        // ข้อปัจจุบัน (เริ่มที่ 0)
let isRandomMode = false;    // โหมดสุ่ม (true = สุ่ม, false = เรียงปกติ)
let currentCategory = 'all'; // หมวดหมู่ปัจจุบัน
let isAnswered = false;      // สถานะว่าตอบข้อนี้ไปหรือยัง
let score = 0;               // คะแนนสะสม

// ==========================================
// 🚀 เริ่มต้นทำงานเมื่อเปิดเว็บ (Initialization)
// ==========================================
window.onload = function() {
    // ตรวจสอบว่ามีข้อมูลโจทย์โหลดเข้ามาหรือไม่
    if (typeof allExamSets === 'undefined' || allExamSets.length === 0) {
        console.warn("ไม่พบข้อมูลชุดข้อสอบ กรุณาตรวจสอบไฟล์ questions.js");
        return;
    }

    renderExamSelector(); // สร้าง Dropdown เลือกชุดข้อสอบ

    // (Optional) เลือกชุดแรกให้เลยโดยอัตโนมัติ เพื่อความสะดวก
    if (allExamSets.length > 0) {
        const selector = document.getElementById('exam-selector');
        selector.value = allExamSets[0].id;
        changeExamSet();
    }
};

// ==========================================
// 📂 ส่วนจัดการเลือกชุดข้อสอบ (Exam Set Selection)
// ==========================================

// 1. สร้างตัวเลือกใน Dropdown (Sidebar)
function renderExamSelector() {
    const selector = document.getElementById('exam-selector');
    
    // เคลียร์ option เก่า (เก็บตัวแรกไว้คือ "-- กรุณาเลือก --")
    selector.innerHTML = '<option value="">-- กรุณาเลือกชุดข้อสอบ --</option>';

    // วนลูปสร้างตัวเลือกตามจำนวนไฟล์โจทย์ที่มี
    allExamSets.forEach(set => {
        const opt = document.createElement('option');
        opt.value = set.id;
        opt.innerText = set.name;
        selector.appendChild(opt);
    });
}

// 2. ฟังก์ชันทำงานเมื่อผู้ใช้เปลี่ยน Dropdown
function changeExamSet() {
    const selector = document.getElementById('exam-selector');
    const selectedId = selector.value;
    
    // ค้นหาข้อมูลชุดข้อสอบที่ตรงกับ ID ที่เลือก
    activeExamSet = allExamSets.find(set => set.id === selectedId);
    
    if (activeExamSet) {
        // กรณีเจอข้อมูล: อัปเดตชื่อชุดข้อสอบ และรีเซ็ตระบบ
        document.getElementById('current-exam-name').innerText = activeExamSet.name;
        renderCategoryButtons(); // สร้างปุ่มหมวดหมู่ใหม่
        selectCategory('all');   // เริ่มต้นที่ "รวมทุกวิชา"
        
        // เปิดใช้งานปุ่มย้อนกลับ (เผื่อถูกปิดไว้)
        document.getElementById('btn-prev').disabled = false;
    } else {
        // กรณีเลือกตัวเลือกว่าง: เคลียร์หน้าจอ
        resetToEmptyState();
    }
}

// ฟังก์ชันช่วยเคลียร์หน้าจอเมื่อไม่ได้เลือกชุดข้อสอบ
function resetToEmptyState() {
    document.getElementById('current-exam-name').innerText = "กรุณาเลือกชุดข้อสอบ";
    document.getElementById('current-cat-badge').innerText = "รอการเลือก...";
    document.getElementById('question-text').innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400"><i class="fa-solid fa-hand-pointer text-4xl mb-4 text-indigo-200 animate-bounce"></i><p>กรุณาเลือกชุดข้อสอบจากเมนูด้านซ้าย<br>เพื่อเริ่มต้นทำข้อสอบ</p></div>`;
    document.getElementById('options-container').innerHTML = "";
    document.getElementById('category-list').innerHTML = '<div class="text-center text-gray-400 text-sm py-4 italic">กรุณาเลือกวิชาด้านบนก่อน</div>';
    document.getElementById('btn-prev').disabled = true;
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('explanation-box').classList.add('hidden');
    document.getElementById('q-index').innerText = "0";
    document.getElementById('q-total').innerText = "0";
    document.getElementById('score-val').innerText = "0";
}

// ==========================================
// 🏷️ ส่วนจัดการหมวดหมู่ (Categories)
// ==========================================

// 3. สร้างปุ่มหมวดหมู่ด้านซ้าย
function renderCategoryButtons() {
    if (!activeExamSet) return;

    // ดึงรายชื่อหมวดหมู่ทั้งหมดแบบไม่ซ้ำ
    const categories = ['all', ...new Set(activeExamSet.data.map(q => q.category))];
    const container = document.getElementById('category-list');
    
    container.innerHTML = ''; // ล้างปุ่มเก่า
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        const label = cat === 'all' ? 'รวมทุกวิชา' : cat;
        
        // กำหนด Class พื้นฐาน
        btn.className = `sidebar-btn w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-indigo-700 transition mb-1 border-l-4 border-transparent flex items-center`;
        btn.innerHTML = `<i class="fa-solid fa-tag mr-2 text-xs opacity-50"></i> ${label}`;
        btn.onclick = () => selectCategory(cat); // เมื่อคลิกให้เรียกฟังก์ชันเลือกหมวด
        btn.dataset.category = cat;
        
        container.appendChild(btn);
    });
}

// 4. ฟังก์ชันเลือกหมวดหมู่ (Core Logic ในการเตรียมโจทย์)
function selectCategory(category) {
    if (!activeExamSet) return;
    currentCategory = category;
    
    // --- 4.1 Highlight ปุ่มที่เลือก ---
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        if(btn.dataset.category === category) {
            btn.className = `sidebar-btn w-full text-left px-4 py-2.5 rounded-lg text-sm transition mb-1 border-l-4 border-yellow-400 bg-indigo-50 text-indigo-900 font-bold shadow-sm flex items-center`;
        } else {
            btn.className = `sidebar-btn w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-indigo-700 transition mb-1 border-l-4 border-transparent flex items-center`;
        }
    });

    // --- 4.2 กรองโจทย์ตามหมวด ---
    let filtered = (category === 'all') 
        ? [...activeExamSet.data] 
        : activeExamSet.data.filter(q => q.category === category);

    // --- 4.3 ถ้าเป็นโหมดสุ่ม ให้สลับตำแหน่ง (Shuffle) ---
    if (isRandomMode) {
        for (let i = filtered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }
    }

    // --- 4.4 รีเซ็ตตัวแปรเกม ---
    currentQuestions = filtered;
    currentIndex = 0;
    score = 0;
    
    // --- 4.5 อัปเดต UI ---
    const badgeIcon = category === 'all' ? '<i class="fa-solid fa-layer-group mr-1"></i>' : '<i class="fa-solid fa-tag mr-1"></i>';
    document.getElementById('current-cat-badge').innerHTML = `${badgeIcon} ${category === 'all' ? 'รวมทุกวิชา' : category}`;
    document.getElementById('score-val').innerText = "0";
    
    // เริ่มโหลดข้อแรก
    loadQuestion();
}

// ==========================================
// 🎮 ส่วนควบคุมการเล่น (Game Logic)
// ==========================================

// 5. เลือกโหมด (เรียง / สุ่ม)
function setMode(mode) {
    isRandomMode = (mode === 'random');
    
    // Style ปุ่มโหมด
    const activeClass = "flex-1 px-3 py-2 rounded-md text-sm font-bold transition text-center bg-indigo-600 text-white shadow-md transform scale-105";
    const inactiveClass = "flex-1 px-3 py-2 rounded-md text-sm font-medium transition text-center bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700";
    
    document.getElementById('btn-mode-normal').className = !isRandomMode ? activeClass : inactiveClass;
    document.getElementById('btn-mode-random').className = isRandomMode ? activeClass : inactiveClass;

    // ถ้ามีการเลือกชุดข้อสอบอยู่แล้ว ให้โหลดใหม่ตามโหมดที่เปลี่ยน
    if (activeExamSet) selectCategory(currentCategory);
}

// 6. โหลดโจทย์ขึ้นหน้าจอ
function loadQuestion() {
    // กรณีไม่มีโจทย์
    if (currentQuestions.length === 0) {
        document.getElementById('question-text').innerText = "ไม่พบข้อสอบในหมวดหมู่นี้";
        document.getElementById('options-container').innerHTML = "";
        return;
    }

    const q = currentQuestions[currentIndex];
    isAnswered = false;
    
    // ซ่อนปุ่มถัดไปและเฉลย
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('explanation-box').classList.add('hidden');
    
    // อัปเดตตัวเลขข้อ
    document.getElementById('q-index').innerText = currentIndex + 1;
    document.getElementById('q-total').innerText = currentQuestions.length;
    
    // จัดการสถานะปุ่มย้อนกลับ (ปิดถ้าอยู่ข้อแรก)
    document.getElementById('btn-prev').disabled = (currentIndex === 0);
    document.getElementById('btn-prev').classList.toggle('opacity-50', currentIndex === 0);
    document.getElementById('btn-prev').classList.toggle('cursor-not-allowed', currentIndex === 0);

    // แสดงโจทย์
    document.getElementById('question-text').innerText = q.question;
    // เติม 'h-full' และ 'py-10' เข้าไปครับ
    document.getElementById('question-text').classList.remove('flex', 'items-center', 'justify-center', 'text-gray-400', 'h-full', 'py-10');
    
    // สร้างตัวเลือก
    const optContainer = document.getElementById('options-container');
    optContainer.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        const prefix = ['ก', 'ข', 'ค', 'ง'][index];
        
        btn.className = "btn-option w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition duration-200 text-gray-700 bg-white shadow-sm flex items-start group relative overflow-hidden";
        btn.innerHTML = `
            <span class="font-bold mr-3 text-indigo-600 bg-indigo-50 w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 group-hover:bg-indigo-200 transition z-10">${prefix}</span> 
            <span class="pt-1 z-10 text-base leading-relaxed">${opt}</span>
        `;
        
        btn.onclick = () => checkAnswer(index, btn);
        optContainer.appendChild(btn);
    });
}

// 7. ตรวจคำตอบ
function checkAnswer(selectedIndex, btnElement) {
    if (isAnswered) return; // ห้ามกดซ้ำ
    isAnswered = true;
    
    const q = currentQuestions[currentIndex];
    const correctIndex = q.correct;
    const allBtns = document.querySelectorAll('.btn-option');

    if (selectedIndex === correctIndex) {
        // ✅ ตอบถูก
        btnElement.classList.remove('bg-white', 'border-gray-200', 'hover:border-indigo-400', 'hover:bg-indigo-50');
        btnElement.classList.add('bg-green-50', 'border-green-500', 'text-green-800', 'ring-1', 'ring-green-500');
        btnElement.querySelector('span:first-child').classList.add('bg-green-200', 'text-green-800');
        
        // เพิ่มไอคอนถูก
        btnElement.innerHTML += `<i class="fa-solid fa-circle-check absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-2xl animate-bounce"></i>`;
        
        score++;
    } else {
        // ❌ ตอบผิด
        btnElement.classList.remove('bg-white', 'border-gray-200', 'hover:border-indigo-400', 'hover:bg-indigo-50');
        btnElement.classList.add('bg-red-50', 'border-red-500', 'text-red-800');
        btnElement.querySelector('span:first-child').classList.add('bg-red-200', 'text-red-800');
        
        // เพิ่มไอคอนผิด
        btnElement.innerHTML += `<i class="fa-solid fa-circle-xmark absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 text-2xl"></i>`;
        
        // เฉลยข้อที่ถูกให้เห็น
        const correctBtn = allBtns[correctIndex];
        correctBtn.classList.remove('bg-white', 'border-gray-200');
        correctBtn.classList.add('bg-green-50', 'border-green-500', 'text-green-800', 'opacity-70');
        correctBtn.querySelector('span:first-child').classList.add('bg-green-200', 'text-green-800');
        correctBtn.innerHTML += `<i class="fa-solid fa-check absolute right-4 top-1/2 transform -translate-y-1/2 text-green-600 text-xl"></i>`;
    }

    // อัปเดตคะแนน
    document.getElementById('score-val').innerText = score;

    // แสดงคำอธิบาย (ถ้ามี)
    if (q.explanation) {
        document.getElementById('explanation-text').innerText = q.explanation;
        document.getElementById('explanation-box').classList.remove('hidden');
    }

    // แสดงปุ่มข้อถัดไป
    document.getElementById('next-btn').classList.remove('hidden');
    
    // Auto scroll ไปที่ปุ่มถัดไป (ในมือถือจะช่วยให้อ่านเฉลยง่ายขึ้น)
    if(window.innerWidth < 768) {
        setTimeout(() => {
            document.getElementById('explanation-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// 8. ไปข้อถัดไป
function nextQuestion() {
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        loadQuestion();
        // เลื่อนกลับไปบนสุดของกล่องโจทย์
        document.querySelector('.overflow-y-auto').scrollTop = 0;
    } else {
        // จบการทดสอบ
        const percent = Math.round((score / currentQuestions.length) * 100);
        let msg = "";
        if(percent >= 80) msg = "สุดยอดมาก! 🎉";
        else if(percent >= 60) msg = "ผ่านเกณฑ์! 👍";
        else msg = "พยายามอีกนิดนะ! ✌️";

        if(confirm(`🏁 จบการทดสอบ!\n\n${msg}\nคะแนนของคุณคือ: ${score} / ${currentQuestions.length} (${percent}%)\n\nต้องการเริ่มใหม่หรือไม่?`)) {
            currentIndex = 0;
            score = 0;
            if(isRandomMode) selectCategory(currentCategory); // สุ่มใหม่ถ้าอยู่ในโหมดสุ่ม
            else loadQuestion();
        }
    }
}

// 9. ย้อนกลับ
function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        loadQuestion();
        document.querySelector('.overflow-y-auto').scrollTop = 0;
        
        // หมายเหตุ: การย้อนกลับจะ reset สถานะการตอบ ทำให้ต้องตอบใหม่ (ไม่ได้เก็บ history ในเวอร์ชันนี้)
    }
}