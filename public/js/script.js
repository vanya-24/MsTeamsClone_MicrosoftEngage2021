const socket = io('/');
const peer = new Peer();
let myVideoStream;
let myId;

const user = prompt("Enter name to display");

var videoGrid = document.getElementById('video-grid')
var myvideo = document.createElement('video');
myvideo.muted = true;
const peerConnections = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  myVideoStream = stream;
  addVideo(myvideo, stream);
  peer.on('call', call => {
    call.answer(stream);
    const vid = document.createElement('video');
    call.on('stream', userStream => {
      addVideo(vid, userStream);
    })
    call.on('error', (err) => {
      alert(err)
    })
    call.on("close", () => {
      console.log(vid);
      vid.remove();
    })
    peerConnections[call.peer] = call;
  })
}).catch(err => {
  alert(err.message)
})
peer.on('open', (id) => {
  myId = id;
  socket.emit("newUser", id, roomID, user);
})
peer.on('error', (err) => {
  alert(err.type);
});
socket.on('userJoined', id => {
  console.log("new user joined")
  const call = peer.call(id, myVideoStream);
  const vid = document.createElement('video');
  call.on('error', (err) => {
    alert(err);
  })
  call.on('stream', userStream => {
    addVideo(vid, userStream);
  })
  call.on('close', () => {
    vid.remove();
    console.log("user disconect")
  })
  peerConnections[id] = call;
})

socket.on('userDisconnect', id => {
  if (peerConnections[id]) {
    peerConnections[id].close();
  }
})
function addVideo(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video);
}


let msg = $('input')

// $ sign for JQuery
$('html').keydown((e) => {
  if (e.which == 13 && msg.val().length !== 0) {    //// e.which = 13 === enter key

    socket.emit('message', msg.val());
    msg.val('');  /// clear the input
  }
});



// get Current Date
var today = new Date();
var dd = today.getDate();

var mm = today.getMonth() + 1;
var yyyy = today.getFullYear();
if (dd < 10) {
  dd = '0' + dd;
}

if (mm < 10) {
  mm = '0' + mm;
}
today = dd + '-' + mm + '-' + yyyy;



// Scroll to bottom when chat overflows
const scrollToBottom = () => {
  let d = $('.chat');
  d.scrollTop(d.prop("scrollHeight"));
}

socket.on('createMessage', (message, username) => {
  $('ul').append(`<li class="message"><b> ${username === user ? "You" : username
    }</b><span>  ${today}</span><br/>${message}</li>`)
  scrollToBottom()
})



// Mute our audio
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  }
  else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html =
    `<i class="fas fa-microphone"></i>
    <span>Mute</span> `
  document.querySelector('.mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html =
    `<i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>`
  document.querySelector('.mute_button').innerHTML = html;

}
// stop video
const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

// Play Video
const setPlayVideo = () => {
  const html = `
  <i class ="stop fas fa-video-slash"></i>
  <span>Play Video</span>
  `
  document.querySelector('.stop_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
  <i class ="fas fa-video"></i>
  <span>Stop Video</span>
  `
  document.querySelector('.stop_button').innerHTML = html;
}

// Leave Meeting

const leaveMeeting = () => {
  alert("Are you sure you want to exit?")
}

// Copy url
const Copy = () => {
  prompt('Invite friends using the given link:', window.location);
}


