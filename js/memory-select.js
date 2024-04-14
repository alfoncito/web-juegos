const main = () => {
  handleDificultyButtons();
  toggleCollapseSelectorDificulty();
};

const handleDificultyButtons = () => {
  let $btnActive = document.querySelector(".btn-dificulty-active"),
    dificulty = $btnActive.dataset.dificulty;

  adjustDificulty(dificulty);
  document.addEventListener("click", (e) => {
    if (e.target.matches(".btn-dificulty")) {
      $btnActive.classList.remove("btn-dificulty-active");
      $btnActive = e.target;
      dificulty = $btnActive.dataset.dificulty;
      $btnActive.classList.add("btn-dificulty-active");
      adjustDificulty(dificulty);
    }
  });
};

const adjustDificulty = (dificulty) => {
  let links = Array.from(document.querySelectorAll(".js-memory-link"));

  links.forEach((link) => {
    let objectLink = new URL(link.href);

    if (objectLink.searchParams.has("dificulty"))
      objectLink.searchParams.set("dificulty", dificulty);
    else objectLink.searchParams.append("dificulty", dificulty);
    link.href = objectLink.href;
  });
};

document.addEventListener("DOMContentLoaded", main);
