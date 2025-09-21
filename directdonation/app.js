(function () {
    const views = {
        start: document.getElementById('view-start'),
        oneTime: document.getElementById('view-oneTime'),
        recurring: document.getElementById('view-recurring'),
        confirmation: document.getElementById('view-confirmation'),
    };

    const header = document.getElementById('siteHeader');
    const leftCol = document.getElementById('leftCol');
    const rightAside = document.getElementById('rightAside');

    // Position and toggle the left floating match card independently of the receipt panel
    function positionLeftMatchCard() {
        const leftAside = document.getElementById('leftMatchAside');
        const leftCard = document.getElementById('leftMatchCard');
        if (!leftAside || !leftCard) return;
        const headerHeight = header ? header.offsetHeight : 0;
        const shouldShow = (state.view === 'oneTime' || state.view === 'recurring') && window.innerWidth >= 1024;
        if (shouldShow) {
            leftAside.classList.remove('hidden');
            leftAside.style.position = 'fixed';
            leftAside.style.top = headerHeight + 24 + 'px';
            leftAside.style.left = '40px';
        } else {
            leftAside.classList.add('hidden');
        }
    }

	const summary = {
        card: document.getElementById('summaryCard'),
        headlineTotal: document.getElementById('sumHeadlineTotal'),
        itemization: document.getElementById('creditsItemization'),
        creditsNote: document.getElementById('creditsNote'),
        covered: document.getElementById('sumCovered'),
        due: document.getElementById('sumDue'),
        total: document.getElementById('sumTotal'),
	};

	const buttons = {
		checkout: document.getElementById('checkoutBtn'),
		startDonate: document.getElementById('startDonateBtn'),
		chooseBack: document.getElementById('chooseBackBtn'),
		chooseContinue: document.getElementById('chooseContinueBtn'),
		oneTimeBack: document.getElementById('oneTimeBackBtn'),
		oneTimeContinue: document.getElementById('oneTimeContinueBtn'),
		recurringBack: document.getElementById('recurringBackBtn'),
		recurringContinue: document.getElementById('recurringContinueBtn'),
		confirmDone: document.getElementById('confirmDoneBtn'),
	};

	const inputs = {
		amountChips: document.getElementById('amountChips'),
		customAmount: document.getElementById('customAmount'),
		amountError: document.getElementById('amountError'),
		otAmountChips: document.getElementById('otAmountChips'),
		otCustomAmount: document.getElementById('otCustomAmount'),
		otAmountError: document.getElementById('otAmountError'),
		creditRows: () => Array.from(document.querySelectorAll('#creditsList .credit-row')),
		userCoversFee: document.getElementById('userCoversFee'),
		monthlyDay: document.getElementById('monthlyDay'),
		weeklyInterval: document.getElementById('weeklyInterval'),
		weeklyStart: document.getElementById('weeklyStart'),
	};

	const confirmEls = {
		amount: document.getElementById('confirmAmount'),
		cadence: document.getElementById('confirmCadence'),
		fee: document.getElementById('confirmFee'),
		total: document.getElementById('confirmTotal'),
	};

    const state = {
		view: 'start',
		donationType: null, // 'oneTime' | 'recurring'
		amount: 0,
		otCreditsApplied: 0,
		userCoversFee: false,
		cadence: null, // 'monthly' | 'weekly' | 'semiMonthly'
		monthlyDay: null,
		weeklyInterval: 1,
		weeklyStart: null,
		employerCoversFee: false,
        matchEdited: false,
	};
    let isChooseOpen = false;

    function show(view) {
		Object.values(views).forEach((el) => el.classList.add('hidden'));
		views[view].classList.remove('hidden');
		state.view = view;
		updateHeaderCta();
        // Hide header on start screen or when modal is open
        if (header) header.classList.toggle('hidden', view === 'start' || isChooseOpen);
        // Keep main content centered always; toggle the floating receipt panel separately
        if (rightAside) {
            if (view === 'start') {
                rightAside.classList.add('hidden');
            }
        }
        // Ensure match card is shown on one-time and recurring screens from the start
        positionLeftMatchCard();
	}

    function openChooseModal() {
        const overlay = document.getElementById('view-choose');
        if (!overlay) return;
        isChooseOpen = true;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        if (header) header.classList.add('hidden');
        // reset selection on open as well
        state.donationType = null;
        if (buttons.chooseContinue) buttons.chooseContinue.disabled = true;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
    }

    function closeChooseModal() {
        const overlay = document.getElementById('view-choose');
        if (!overlay) return;
        isChooseOpen = false;
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        if (header) header.classList.toggle('hidden', state.view === 'start');
        // reset selection when closing
        state.donationType = null;
        buttons.chooseContinue.disabled = true;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
    }

    function updateHeaderCta() {
        let enabled = false;
        if (state.view === 'recurring') enabled = canProceedRecurring();
        if (state.view === 'oneTime') enabled = canProceedOneTime();
        buttons.checkout.disabled = !enabled;
    }

	function toDollar(n) {
		return `$${(n || 0).toFixed(2)}`;
	}

	function feeFor(amount) {
		if (state.view === 'recurring') {
			if (state.employerCoversFee) return 0;
			return amount * 0.029 + 0.3;
		}
		// one-time
		if (!state.userCoversFee) return 0;
		return amount * 0.029 + 0.3;
	}

    function recomputeSummary() {
        // Determine visibility of summary
        const hasSelection = (state.view === 'oneTime' && ((state.otCreditsApplied || 0) > 0 || (state.amount || 0) > 0))
            || (state.view === 'recurring');
        const showPanel = hasSelection || state.view === 'confirmation';
        if (showPanel) {
            rightAside && rightAside.classList.remove('hidden');
            summary.card.classList.remove('hidden');
            const contentRect = document.querySelector('#centerContent')?.getBoundingClientRect();
            const headerHeight = header ? header.offsetHeight : 0;
            const panelWidth = 384; // px
            const canFitRight = (window.innerWidth - (contentRect?.right || 0)) >= (panelWidth + 24);
            if (canFitRight) {
                // fixed to right below sticky header (accounts for scroll)
                summary.card.style.position = 'fixed';
                summary.card.style.top = headerHeight + 'px';
                summary.card.style.right = '0';
                summary.card.style.left = 'auto';
                summary.card.style.bottom = '0';
                summary.card.style.width = panelWidth + 'px';
                summary.card.style.height = `calc(100vh - ${headerHeight}px)`;
                // update left match card position
                positionLeftMatchCard();
            } else {
                // bottom dock
                summary.card.style.position = 'fixed';
                summary.card.style.left = '0';
                summary.card.style.right = '0';
                summary.card.style.bottom = '0';
                summary.card.style.top = 'auto';
                summary.card.style.width = '100%';
                summary.card.style.height = '50vh';
                const leftAside = document.getElementById('leftMatchAside');
                if (leftAside) leftAside.classList.add('hidden');
            }
        } else {
            // Hide the receipt panel, but keep/update the left match card visibility
            summary.card.classList.add('hidden');
            rightAside && rightAside.classList.add('hidden');
            // On one-time or recurring screens, the match card remains visible on desktop
            const leftAside = document.getElementById('leftMatchAside');
            if (leftAside) {
                if (state.view === 'oneTime' || state.view === 'recurring') {
                    const headerHeight = header ? header.offsetHeight : 0;
                    if (window.innerWidth >= 1024) {
                        leftAside.classList.remove('hidden');
                        leftAside.style.position = 'fixed';
                        leftAside.style.top = headerHeight + 24 + 'px';
                        leftAside.style.left = '40px';
                    } else {
                        leftAside.classList.add('hidden');
                    }
                } else {
                    leftAside.classList.add('hidden');
                }
            }
        }

        const pledge = state.amount || 0;
        const credits = state.view === 'oneTime' ? (state.otCreditsApplied || 0) : 0;
        const matchInputEl = document.getElementById('matchAmountInput');
        let userMatchOverrideRaw = matchInputEl ? parseFloat(matchInputEl.value) : NaN;
        // If user has not edited match or typed 0/NaN, mirror pledge by default
        if (!state.matchEdited) {
            userMatchOverrideRaw = pledge;
            if (matchInputEl) matchInputEl.value = String(pledge.toFixed(2));
        }
        const defaultMatch = pledge > 0 ? pledge : 0; // 1x by default
        // If user entered a value higher than pledge, clamp back to 1x
        const matchFromCompany = isNaN(userMatchOverrideRaw)
            ? defaultMatch
            : Math.max(0, Math.min(userMatchOverrideRaw, defaultMatch));
        const donationTotal = pledge + credits + matchFromCompany; // total donated to org includes company match
        const feeBase = Math.max(0, pledge); // fees apply only to user's pledge
        const fee = feeFor(feeBase);
        const total = pledge + fee; // amount due from user
        if (summary.headlineTotal) summary.headlineTotal.textContent = toDollar(donationTotal);
        if (summary.covered) summary.covered.textContent = toDollar(credits + matchFromCompany);
        if (summary.due) summary.due.textContent = toDollar(total);
        if (summary.total) summary.total.textContent = toDollar(donationTotal);

        const matchDisplay = document.getElementById('matchDisplay');
        const matchText = document.getElementById('matchDisplayText');
        const matchInputGroup = document.getElementById('matchInputGroup');
        if (matchDisplay && matchText && matchInputGroup) {
            if (pledge > 0) {
                matchDisplay.classList.remove('hidden');
                matchText.textContent = `${toDollar(matchFromCompany)} will be matched`;
            } else {
                matchDisplay.classList.add('hidden');
                matchInputGroup.classList.add('hidden');
            }
        }

        // build itemized credit rows
        if (summary.itemization) {
            summary.itemization.innerHTML = '';

            const addItemCard = (title, subtitle, amount, options = {}) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex items-center justify-between rounded-md border border-gray-200 bg-white p-3';
                const left = document.createElement('div');
                const titleEl = document.createElement('div');
                titleEl.className = 'font-medium text-zinc-900';
                titleEl.textContent = title;
                const subEl = document.createElement('div');
                subEl.className = 'text-xs text-gray-500';
                subEl.textContent = subtitle;
                left.appendChild(titleEl);
                left.appendChild(subEl);
                const right = document.createElement('div');
                right.className = 'font-medium';
                right.textContent = toDollar(amount);
                if (subtitle === 'Donation credit' || subtitle === 'Your company is matching your pledge') {
                    right.classList.add('text-emerald-700');
                }
                // spacing below credits handled before pledge group; do not add per-item margin
                wrapper.appendChild(left);
                wrapper.appendChild(right);
                summary.itemization.appendChild(wrapper);
            };

            let itemCount = 0;
            let creditCount = 0;
            let lastCreditEl = null;
            let lastCard; // to connect pledge and match visually regardless of credits count
            // gather checked credit rows
            inputs.creditRows().forEach((row) => {
                const enabled = row.querySelector('.credit-enable').checked;
                const labelEl = row.querySelector('label span');
                const name = labelEl ? labelEl.querySelector('.font-medium')?.textContent || labelEl.textContent : 'Donation credit';
                const input = row.querySelector('.credit-input');
                const val = enabled ? (parseFloat(input.value) || 0) : 0;
                if (enabled && val > 0) {
                    lastCreditEl = addItemCard(name.trim(), 'Donation credit', val);
                    lastCard = lastCreditEl;
                    itemCount++;
                    creditCount++;
                }
            });

            // Show connected pledge/match pair only when a pledge is entered (> 0)
            const shouldShowPledgeGroup = state.view === 'oneTime' && pledge > 0;
            if (shouldShowPledgeGroup) {
                // ensure 12px gap below the last credit when pledge/match is present
                if (lastCreditEl) lastCreditEl.classList.add('mb-3');
                lastCard = addItemCard('Your pledge', 'This is your portion of this donation', pledge);
                itemCount++;
                addItemCard('CBC Capital match', 'Your company is matching your pledge', matchFromCompany);
                itemCount++;
            }

            if (summary.creditsNote) {
                summary.creditsNote.textContent = `This will appear as ${itemCount} transaction${itemCount === 1 ? '' : 's'} in your giving history`;
                // keep element height to preserve spacing, but hide text when only one item
                summary.creditsNote.classList.toggle('invisible', itemCount <= 1);
            }
        }
        updateHeaderCta();
    }

	function canProceedRecurring() {
		if (!(state.amount >= 5)) return false;
		if (state.cadence === 'monthly') return !!state.monthlyDay;
		if (state.cadence === 'weekly') return !!state.weeklyInterval && !!state.weeklyStart;
		if (state.cadence === 'semiMonthly') return true;
		return false;
	}

    function canProceedOneTime() {
        const creditsOk = (state.otCreditsApplied || 0) > 0;
        const pledgeOk = state.amount >= 5;
        return creditsOk || pledgeOk;
    }

	// Inject options
	(function initOptions() {
		for (let d = 1; d <= 31; d++) {
			const opt = document.createElement('option');
			opt.value = String(d);
			opt.textContent = String(d);
			inputs.monthlyDay.appendChild(opt);
		}
		for (let w = 1; w <= 8; w++) {
			const opt = document.createElement('option');
			opt.value = String(w);
			opt.textContent = String(w);
			inputs.weeklyInterval.appendChild(opt);
		}
	})();

	// Event wiring
    buttons.startDonate.addEventListener('click', () => openChooseModal());
    buttons.oneTimeBack && buttons.oneTimeBack.addEventListener('click', () => openChooseModal());
    buttons.recurringBack && buttons.recurringBack.addEventListener('click', () => openChooseModal());
    // Header/side actions
    function triggerCheckout() {
        if (state.view === 'recurring' && canProceedRecurring()) {
            // mimic continue
            confirmEls.amount.textContent = toDollar(state.amount);
            confirmEls.fee.textContent = toDollar(feeFor(state.amount));
            confirmEls.total.textContent = toDollar(state.amount + feeFor(state.amount));
            let cadenceText = '';
            if (state.cadence === 'monthly') cadenceText = `Monthly on day ${state.monthlyDay}`;
            if (state.cadence === 'weekly') cadenceText = `Every ${state.weeklyInterval} week(s) starting ${state.weeklyStart}`;
            if (state.cadence === 'semiMonthly') cadenceText = '1st and 15th each month';
            confirmEls.cadence.textContent = cadenceText;
            show('confirmation');
            recomputeSummary();
            return;
        }
        if (state.view === 'oneTime' && canProceedOneTime()) {
            const credits = state.otCreditsApplied || 0;
            confirmEls.amount.textContent = toDollar((state.amount || 0) + credits);
            confirmEls.cadence.textContent = 'One-time';
            confirmEls.fee.textContent = toDollar(feeFor(Math.max(0, state.amount - (state.otCreditsApplied||0))));
            confirmEls.total.textContent = toDollar(Math.max(0, state.amount - (state.otCreditsApplied||0)) + feeFor(Math.max(0, state.amount - (state.otCreditsApplied||0))));
            show('confirmation');
            recomputeSummary();
        }
    }
    buttons.checkout.addEventListener('click', triggerCheckout);
    document.getElementById('checkoutBtnSide')?.addEventListener('click', triggerCheckout);

    document.getElementById('exitBtn')?.addEventListener('click', () => {
        show('start');
    });

	Array.from(document.querySelectorAll('input[name="donationType"]')).forEach((input) => {
		input.addEventListener('change', () => {
			state.donationType = input.value;
			buttons.chooseContinue.disabled = false;
		});
	});

    // Modal selection cards (event delegation ensures clicks on inner elements count)
    const chooseContainer = document.getElementById('view-choose');
    function handleSelectCard(target) {
        const card = target.closest('.select-card');
        if (!card || !chooseContainer || chooseContainer.classList.contains('hidden')) return;
        state.donationType = card.getAttribute('data-type');
        if (buttons.chooseContinue) buttons.chooseContinue.disabled = false;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
    }
    Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((card) => {
        card.addEventListener('click', (e) => handleSelectCard(e.target));
    });

    const chooseCloseBtn = document.getElementById('chooseCloseBtn');
    const chooseCancelBtn = document.getElementById('chooseCancelBtn');
    chooseCloseBtn && chooseCloseBtn.addEventListener('click', () => closeChooseModal());
    chooseCancelBtn && chooseCancelBtn.addEventListener('click', () => closeChooseModal());

	// Click outside modal to close
    const chooseOverlay = document.getElementById('view-choose');
    if (chooseOverlay) {
        // close on backdrop click only; clicks inside the card should not bubble to close
        chooseOverlay.addEventListener('click', (e) => {
            if (e.target === chooseOverlay) {
                closeChooseModal();
            }
        });
        // stop propagation for inner card area
        const cardEl = chooseOverlay.querySelector('.card');
        cardEl && cardEl.addEventListener('click', (e) => e.stopPropagation());
    }

    buttons.chooseContinue.addEventListener('click', () => {
        const selected = state.donationType; // capture before modal clears state
        closeChooseModal();
        if (selected === 'oneTime') show('oneTime');
        if (selected === 'recurring') show('recurring');
        recomputeSummary();
    });

	inputs.amountChips.addEventListener('click', (e) => {
		const btn = e.target.closest('[data-amount]');
		if (!btn) return;
		const val = parseFloat(btn.getAttribute('data-amount')) || 0;
		state.amount = val;
		inputs.customAmount.value = '';
		inputs.amountError.classList.toggle('hidden', val >= 5);
		Array.from(inputs.amountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
		btn.classList.add('active');
		// Always present match input; mirror pledge at 1x when changed
        const matchInputEl = document.getElementById('matchAmountInput');
        if (matchInputEl) {
            matchInputEl.value = String(state.amount.toFixed(2));
            state.matchEdited = false;
        }
		recomputeSummary();
	});

	inputs.customAmount.addEventListener('input', () => {
		const val = parseFloat(inputs.customAmount.value);
		state.amount = isNaN(val) ? 0 : val;
		inputs.amountError.classList.toggle('hidden', state.amount >= 5);
		Array.from(inputs.amountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
		recomputeSummary();
	});

	// One-time amount
	inputs.otAmountChips.addEventListener('click', (e) => {
		const btn = e.target.closest('[data-amount]');
		if (!btn) return;
		const val = parseFloat(btn.getAttribute('data-amount')) || 0;
		state.amount = val;
		inputs.otCustomAmount.value = '';
		inputs.otAmountError.classList.toggle('hidden', val >= 5);
		Array.from(inputs.otAmountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
		btn.classList.add('active');
		recomputeSummary();
	});

	inputs.otCustomAmount.addEventListener('input', () => {
		const val = parseFloat(inputs.otCustomAmount.value);
		state.amount = isNaN(val) ? 0 : val;
		inputs.otAmountError.classList.toggle('hidden', state.amount >= 5);
		Array.from(inputs.otAmountChips.querySelectorAll('.chip')).forEach((el) => el.classList.remove('active'));
        const matchInputEl = document.getElementById('matchAmountInput');
        if (matchInputEl) {
            matchInputEl.value = String((state.amount > 0 ? state.amount : 0).toFixed(2));
            state.matchEdited = false;
        }
		recomputeSummary();
	});

    // Reflect manual match override
    document.getElementById('matchAmountInput')?.addEventListener('input', () => {
        // Clamp to 1x if user exceeds pledge; keep value synced
        const input = document.getElementById('matchAmountInput');
        const currentPledge = state.amount > 0 ? state.amount : 0;
        if (input) {
            let val = parseFloat(input.value);
            if (isNaN(val)) val = 0;
            if (val > currentPledge) {
                input.value = String(currentPledge.toFixed(2));
            }
        }
        state.matchEdited = true;
        recomputeSummary();
    });
    // Edit button to switch to input
    document.getElementById('editMatchBtn')?.addEventListener('click', () => {
        const display = document.getElementById('matchDisplay');
        const inputGroup = document.getElementById('matchInputGroup');
        if (display && inputGroup) {
            display.classList.add('hidden');
            inputGroup.classList.remove('hidden');
            const input = document.getElementById('matchAmountInput');
            input && input.focus();
        }
    });

	// Credits inputs
    function recalcCredits() {
		let total = 0;
		inputs.creditRows().forEach((row) => {
			const enabled = row.querySelector('.credit-enable').checked;
			const input = row.querySelector('.credit-input');
			let val = parseFloat(input.value) || 0;
			const max = parseFloat(input.getAttribute('data-max')) || Infinity;
			if (val > max) { val = max; input.value = String(max); }
			if (enabled) total += val;
		});
		// credits cannot exceed amount
        state.otCreditsApplied = Math.min(state.amount + total, total); // additive donation model, but user due only on pledge
	}

    inputs.creditRows().forEach((row) => {
        const enable = row.querySelector('.credit-enable');
        const input = row.querySelector('.credit-input');
        const inputGroup = row.querySelector('.credit-input-group');
        const syncVisibility = () => {
            if (enable.checked) {
                inputGroup.classList.remove('hidden');
            } else {
                inputGroup.classList.add('hidden');
            }
        };
        enable.addEventListener('change', () => { syncVisibility(); recalcCredits(); recomputeSummary(); });
        input.addEventListener('input', () => { recalcCredits(); recomputeSummary(); });
        // initialize hidden state
        syncVisibility();
    });

	inputs.userCoversFee.addEventListener('change', () => {
		state.userCoversFee = inputs.userCoversFee.checked;
		recomputeSummary();
	});

	Array.from(document.querySelectorAll('input[name="cadence"]')).forEach((input) => {
		input.addEventListener('change', () => {
			state.cadence = input.value;
			recomputeSummary();
		});
	});

	inputs.monthlyDay.addEventListener('change', () => {
		state.monthlyDay = parseInt(inputs.monthlyDay.value, 10);
		recomputeSummary();
	});
	inputs.weeklyInterval.addEventListener('change', () => {
		state.weeklyInterval = parseInt(inputs.weeklyInterval.value, 10) || 1;
		recomputeSummary();
	});
	inputs.weeklyStart.addEventListener('change', () => {
		state.weeklyStart = inputs.weeklyStart.value || null;
		recomputeSummary();
	});
	summary.employerCoversFee.addEventListener('change', () => {
		state.employerCoversFee = summary.employerCoversFee.checked;
		recomputeSummary();
	});

    buttons.recurringContinue && buttons.recurringContinue.addEventListener('click', () => {
		// Populate confirmation
		confirmEls.amount.textContent = toDollar(state.amount);
		confirmEls.fee.textContent = toDollar(feeFor(state.amount));
		confirmEls.total.textContent = toDollar(state.amount + feeFor(state.amount));
		let cadenceText = '';
		if (state.cadence === 'monthly') cadenceText = `Monthly on day ${state.monthlyDay}`;
		if (state.cadence === 'weekly') cadenceText = `Every ${state.weeklyInterval} week(s) starting ${state.weeklyStart}`;
		if (state.cadence === 'semiMonthly') cadenceText = '1st and 15th each month';
		confirmEls.cadence.textContent = cadenceText;
		show('confirmation');
		recomputeSummary();
	});

    buttons.oneTimeContinue && buttons.oneTimeContinue.addEventListener('click', () => {
		confirmEls.amount.textContent = toDollar(state.amount);
		confirmEls.cadence.textContent = 'One-time';
		confirmEls.fee.textContent = toDollar(feeFor(Math.max(0, state.amount - (state.otCreditsApplied||0))));
		confirmEls.total.textContent = toDollar(Math.max(0, state.amount - (state.otCreditsApplied||0)) + feeFor(Math.max(0, state.amount - (state.otCreditsApplied||0))));
		show('confirmation');
		recomputeSummary();
	});

	buttons.confirmDone.addEventListener('click', () => {
		show('start');
		// reset minimal state
		state.donationType = null;
		state.amount = 0;
		state.cadence = null;
		summary.employerCoversFee.checked = false;
		recomputeSummary();
	});

    // Initial
	show('start');
	recomputeSummary();
    window.addEventListener('resize', positionLeftMatchCard);
    window.addEventListener('scroll', positionLeftMatchCard, { passive: true });
})();


