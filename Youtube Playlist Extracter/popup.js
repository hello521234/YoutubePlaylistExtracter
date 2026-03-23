document.getElementById('extractBtn').addEventListener('click', async () => {
  const format = document.querySelector('input[name="format"]:checked').value;
  const btn = document.getElementById('extractBtn');
  
  btn.innerText = "열심히 추출 중입니다... ⏳";
  btn.disabled = true;

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url.includes("youtube.com/playlist")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: autoScrollAndExtract
    }, (results) => {
      btn.innerText = "추출 및 저장하기";
      btn.disabled = false;

      if (results && results[0].result) {
        downloadFile(results[0].result, format);
      }
    });
  } else {
    btn.innerText = "추출 및 저장하기";
    btn.disabled = false;
    alert("유튜브 플레이리스트 페이지(youtube.com/playlist)에서 실행해주세요!");
  }
});

// [유튜브 페이지 내부에서 실행되는 함수]
async function autoScrollAndExtract() {
  return new Promise((resolve) => {
    let lastVideoCount = 0;
    let attempts = 0;

    const scrollInterval = setInterval(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      
      // 💡 핵심 수정 부분: '맞춤 동영상'을 제외하고 '플레이리스트 내부'의 영상 개수만 셉니다.
      const currentVideoCount = document.querySelectorAll('ytd-playlist-video-list-renderer ytd-playlist-video-renderer').length;
      
      if (currentVideoCount === lastVideoCount) {
        attempts++;
        if (attempts >= 5) { 
          clearInterval(scrollInterval);
          
          // 💡 핵심 수정 부분: 추출할 때도 '플레이리스트 내부'에 있는 제목만 가져옵니다.
          const titleElements = document.querySelectorAll('ytd-playlist-video-list-renderer ytd-playlist-video-renderer #video-title');
          const titles = [];
          
          titleElements.forEach((el) => {
            const text = el.innerText.trim();
            if (text) titles.push(text);
          });
          
          resolve(titles); 
        }
      } else {
        lastVideoCount = currentVideoCount;
        attempts = 0; 
      }
    }, 500);
  });
}

// 추출한 데이터를 파일로 만들어 다운로드하는 함수
function downloadFile(titles, format) {
  let content = "";
  let filename = "";
  let mimeType = "";

  if (format === 'csv') {
    content = "\uFEFF곡 제목\n"; 
    titles.forEach((title) => {
      content += '"' + title.replace(/"/g, '""') + '"\n';
    });
    filename = "Youtube_Playlist.csv";
    mimeType = 'text/csv;charset=utf-8;';
  } else {
    titles.forEach((title) => {
      content += title + "\n";
    });
    filename = "Youtube_Playlist.txt";
    mimeType = 'text/plain;charset=utf-8;';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}