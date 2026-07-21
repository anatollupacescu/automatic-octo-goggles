const form = document.getElementById("waitlistForm");

if (form) {
  const submitBtn = form.querySelector("button[type='submit']");
  const successMsg = document.getElementById("successMsg");
  const tickerTrack = document.getElementById("tickerTrack");
  const lang = document.documentElement.lang || "ro";

  const labels = {
    ro: {
      loading: "Se încarcă cursurile...",
      submitting: "Se trimite...",
      retry: "Alătură-te listei de așteptare",
      error: "A apărut o eroare. Încearcă din nou.",
      failedSend: "Nu s-a putut trimite formularul. Încearcă din nou."
    },
    ru: {
      loading: "Загружаем курсы...",
      submitting: "Отправка...",
      retry: "Записаться в лист ожидания",
      error: "Произошла ошибка. Попробуйте ещё раз.",
      failedSend: "Не удалось отправить форму. Попробуйте ещё раз."
    }
  };

  const t = labels[lang] || labels.ro;
  const fallbackRates = {
    EUR: 19.42,
    USD: 17.85,
    GBP: 22.61
  };

  function formatRate(value) {
    return Number(value).toFixed(2);
  }

  function renderTicker(rates) {
    if (!tickerTrack) {
      return;
    }

    const items = [
      { label: "EUR → MDL", value: rates.EUR },
      { label: "USD → MDL", value: rates.USD },
      { label: "GBP → MDL", value: rates.GBP },
      { label: lang === "ru" ? "УДАЛЁННЫЙ ДОХОД, МЕСТНАЯ ЖИЗНЬ" : "VENIT DE LA DISTANȚĂ, VIAȚĂ LOCALĂ" }
    ];

    const repeatedItems = [...items, ...items]
      .map((item) => {
        if (item.value === undefined) {
          return `<span>${item.label}</span>`;
        }

        return `<span>${item.label} <b>${formatRate(item.value)}</b></span>`;
      })
      .join("");

    tickerTrack.innerHTML = repeatedItems;
  }

  async function loadExchangeRates() {
    try {
        const response = await fetch("https://open.er-api.com/v6/latest/EUR");

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.result !== "success") {
            throw new Error("Invalid response");
        }

        const rates = {
            EUR: data.rates.MDL,
            USD: data.rates.MDL / data.rates.USD,
            GBP: data.rates.MDL / data.rates.GBP
        };

        renderTicker(rates);
    } catch (error) {
        console.error("Could not fetch live exchange rates:", error);
        renderTicker(fallbackRates);
    }
  }

  if (successMsg) {
    successMsg.style.display = "none";
  }

  if (tickerTrack) {
    renderTicker(fallbackRates);
    loadExchangeRates();
    setInterval(loadExchangeRates, 10 * 60 * 1000);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t.submitting;
    }

    try {
      const formData = new FormData(form);
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwb3C-8-bIIivV0Q0e7ih15LKuagj2zkJPZKstjyRE46Ev20pFvM3_mMvNNm30jwaUVmQ/exec",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (result.success) {
        form.querySelectorAll("input, select, button").forEach((element) => {
          element.disabled = true;
        });

        if (submitBtn) {
          submitBtn.style.display = "none";
        }

        if (successMsg) {
          successMsg.style.display = "block";
        }
      } else {
        console.error(result.error);

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = t.retry;
        }

        alert(t.error);
      }
    } catch (error) {
      console.error(error);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t.retry;
      }

      alert(t.failedSend);
    }
  });
}
