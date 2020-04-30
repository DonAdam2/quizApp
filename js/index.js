let form = document.getElementById('quizeForm'),
  tabs = document.getElementsByClassName('tab'),
  currentTab = 0,
  score = 0,
  fullScore = 0,
  questionsData = {},
  resultsData = {};
const timer = 3000;

//render methods
const renderLoader = () => {
  return '<div class="loader"></div>';
};

const renderQuizeHeader = ({ title, description }) => {
  return `
    <h1>${title}</h1>
    <h3>${description}</h3>
    `;
};

const renderImage = ({ imageSrc, alt }) => {
  return `
    <div class="image-wrapper">
          <img src="${imageSrc}" alt="${alt}" >
        </div>
    `;
};

const renderQuestion = (questionData) => {
  const { q_id, title, img, question_type, possible_answers } = questionData;
  let tabContent = '';

  switch (question_type) {
    case 'mutiplechoice-single': {
      let options = '<option value="">Choose answer...</option>';

      possible_answers.forEach((el) => {
        const option = `<option value="${el.a_id}">${el.caption}</option>`;
        options += option;
      });

      tabContent = `
      <div class="tab">
        ${renderImage({ imageSrc: img, alt: title })}        
        <label>${title}</label>
        <p>
          <select id="${q_id}" class="input">${options}</select>
        </p>
      </div>
              `;
      break;
    }
    case 'truefalse': {
      tabContent = `
      <div class="tab">
        ${renderImage({ imageSrc: img, alt: title })}
        <label>${title}</label>
        <input
            type="checkbox"                  
            class="input"
        />      
      </div>
            `;
      break;
    }
    case 'mutiplechoice-multiple': {
      let options = '';

      possible_answers.forEach((el) => {
        const option = `<option value="${el.a_id}">${el.caption}</option>`;
        options += option;
      });

      tabContent = `
      <div class="tab">
        ${renderImage({ imageSrc: img, alt: title })}
        <label>${title}</label>           
          <select id="${q_id}" multiple="" class="input">${options}</select>        
      </div>
                `;
      break;
    }
    default:
      tabContent = 'invalid type';
  }
  return tabContent;
};

const renderNextButton = () => {
  return `
  <div style="overflow: auto;">
    <div style="float: right;">
      <button type="button" id="nextBtn" onclick="nextTab()">Next</button>
    </div>
  </div>
  `;
};

const renderIndicators = (number) => {
  let steps = '';

  const step = `<span class="step"></span>`;
  for (let i = 0; i < number; i++) {
    steps += step;
  }
  return `<div class="steps-wrapper">${steps}</div>`;
};

const renderAnswerStatus = (value) => {
  const { correct_answer, points, possible_answers } = questionsData.questions[
      currentTab
    ],
    span = document.createElement('span');
  let isCorrect = false,
    correctAnswerString = '';

  if (Array.isArray(correct_answer)) {
    isCorrect =
      value.length === correct_answer.length &&
      value.every((el, i) => parseInt(el) === correct_answer[i]);

    correct_answer.forEach((outerEl, i) => {
      const answer = possible_answers.find((el) => el.a_id === outerEl);

      correctAnswerString += `${answer.caption} ${
        i !== correct_answer.length - 1 ? '& ' : ''
      }`;
    });
  } else if (typeof correct_answer === 'number') {
    const parsedValue = parseInt(value);
    isCorrect = parsedValue === correct_answer;

    correctAnswerString = possible_answers.find(
      (el) => el.a_id === correct_answer
    ).caption;
  } else if (typeof correct_answer === 'boolean') {
    isCorrect = value === correct_answer;

    correctAnswerString = correct_answer;
  }

  if (isCorrect) {
    span.classList.add('status', 'success');
    span.innerText = `correct ${points} points.`;
    score += points;
  } else {
    span.classList.add('status', 'danger');
    span.innerText = `wrong 0 points. (correct answer is "${correctAnswerString}")`;
  }

  return span;
};

const renderFinalResult = () => {
  const result = (score / fullScore) * 100,
    { results } = resultsData;
  let resultInfo = null;

  form.innerHTML = '';

  for (let i = 0; i < results.length; i++) {
    if (result >= results[i].minpoints && result <= results[i].maxpoints) {
      resultInfo = results[i];
      break;
    }
  }

  form.innerHTML += `<h3><span class="status default">score: ${score}%</span></h3>`;

  form.innerHTML += renderQuizeHeader({
    title: resultInfo.title,
    description: resultInfo.message,
  });

  form.innerHTML += renderImage({
    imageSrc: resultInfo.img,
    alt: resultInfo.title,
  });
};

//logic
const nextTab = () => {
  if (!validateForm()) return false;

  document.getElementById('nextBtn').disabled = true;

  setTimeout(() => {
    document.getElementById('nextBtn').disabled = false;
    tabs[currentTab].style.display = 'none';
    currentTab = currentTab + 1;

    if (currentTab >= tabs.length) {
      renderFinalResult();
      return false;
    }

    showTab(currentTab);
  }, timer);
};

const validateForm = () => {
  let valid = true;
  const input = tabs[currentTab].querySelector('.input');

  if (input.value === '') {
    input.className += ' invalid';
    valid = false;
  }

  if (valid) {
    let currentInputValue = input.value;

    if (input.type === 'checkbox') {
      currentInputValue = input.checked;
    } else if (
      questionsData.questions[currentTab].question_type ===
      'mutiplechoice-multiple'
    ) {
      currentInputValue = $(
        `#${questionsData.questions[currentTab].q_id}`
      ).val();
    }

    tabs[currentTab].prepend(renderAnswerStatus(currentInputValue));

    setTimeout(() => {
      document.getElementsByClassName('step')[currentTab].className +=
        ' finish';
    }, timer);
  }

  return valid;
};

const setActiveIndicator = (n) => {
  const steps = document.getElementsByClassName('step');

  for (let i = 0; i < steps.length; i++) {
    steps[i].className = steps[i].className.replace(' active', '');
  }
  steps[n].className += ' active';
};

const showTab = (n) => {
  tabs[n].style.display = 'block';

  if (n === tabs.length - 1) {
    document.getElementById('nextBtn').innerHTML = 'Submit';
  } else {
    document.getElementById('nextBtn').innerHTML = 'Next';
  }

  if (
    questionsData.questions[currentTab].question_type ===
    'mutiplechoice-multiple'
  ) {
    $(`#${questionsData.questions[currentTab].q_id}`).chosen();
  }

  setActiveIndicator(n);
};

const fetchData = async () => {
  try {
    form.innerHTML = renderLoader();

    const questionsApi = await fetch(
        'https://proto.io/en/jobs/candidate-questions/quiz.json'
      ),
      resultsApi = await fetch(
        'https://proto.io/en/jobs/candidate-questions/result.json'
      );

    questionsData = await questionsApi.json();
    resultsData = await resultsApi.json();

    form.innerHTML = '';

    form.innerHTML += renderQuizeHeader({
      title: questionsData.title,
      description: questionsData.description,
    });
    questionsData.questions.forEach((el) => {
      fullScore += el.points;
      form.innerHTML += renderQuestion(el);
    });
    form.innerHTML += renderNextButton();
    form.innerHTML += renderIndicators(questionsData.questions.length);

    showTab(currentTab);
  } catch (err) {
    form.innerHTML += '';
    form.innerHTML +=
      '<h3>Something went wrong while fetching data, please try again later</h3>';
  }
};

window.onload = fetchData();
