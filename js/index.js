const main = () => {
  handleVisibilityLogo();
};

const handleVisibilityLogo = () => {
  let $logo = document.getElementById("logo"),
    $navbar = document.getElementById("navbar");

  const handleScrollMove = () => {
    let navbarBound = $navbar.getBoundingClientRect();

    if (navbarBound.top === 0) $logo.classList.remove("hidden");
    else $logo.classList.add("hidden");
  };

  window.addEventListener("scroll", handleScrollMove);
  handleScrollMove();
};

document.addEventListener("DOMContentLoaded", main, { once: true });
