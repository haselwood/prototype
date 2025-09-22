(function () {
    const views = {
        start: document.getElementById('view-start'),
        oneTime: document.getElementById('view-oneTime'),
        oneTimeFunding: document.getElementById('view-oneTimeFunding'),
        recurring: document.getElementById('view-recurring'),
        oneTimeConfirm: document.getElementById('view-oneTimeConfirm'),
        oneTimePledgeConfirm: document.getElementById('view-oneTimePledgeConfirm'),
        confirmation: document.getElementById('view-confirmation'),
    };

    const header = document.getElementById('siteHeader');
    const progress = {
        container: document.getElementById('progressContainer'),
        fill: document.getElementById('progressFill'),
    };
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
		startDonateNoCredits: document.getElementById('startDonateNoCreditsBtn'),
		backToDonation: document.getElementById('backToDonationBtn'),
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

    const reviewEls = {
        title: document.getElementById('reviewTitle'),
        list: document.getElementById('reviewList'),
        total: document.getElementById('reviewTotal'),
        txnCount: document.getElementById('reviewTxnCount'),
        totalOrg: document.getElementById('reviewTotalOrg'),
        note: document.getElementById('npoNote'),
        anonymous: document.getElementById('npoAnonymous'),
        donateSubmit: document.getElementById('donateSubmit'),
    };
    const pledgeConfirmEls = {
        title: document.getElementById('pledgeReviewTitle'),
        list: document.getElementById('pledgeReviewList'),
        total: document.getElementById('pledgeReviewTotal'),
        txn: document.getElementById('pledgeReviewTxnCount'),
        payMethod: document.getElementById('pledgePayMethod'),
        note: document.getElementById('pledgeNote'),
        anonymous: document.getElementById('pledgeAnonymous'),
        due: document.getElementById('pledgeDue'),
        donateBtn: document.getElementById('pledgeDonateBtn'),
    };
    const fundingEls = {
        amountLabel: document.getElementById('fundingAmountLabel'),
        balance: document.getElementById('fundingBalance'),
        feeFixed: document.getElementById('fundingFeeFixed'),
        feeCardRow: document.getElementById('fundingFeeCardRow'),
        feeCard: document.getElementById('fundingFeeCard'),
        total: document.getElementById('fundingTotal'),
        goingRow: document.getElementById('fundingGoingRow'),
        goingAmount: document.getElementById('fundingGoingAmount'),
        youPay: document.getElementById('fundingYouPay'),
        charity: document.getElementById('fundingCharity'),
        donationRow: document.getElementById('fundingDonation'),
        coverFee: document.getElementById('coverFeeFunding'),
        gsaError: document.getElementById('gsaError'),
        gsaBalanceLabel: document.getElementById('gsaBalanceLabel'),
    };
    const successEls = {
        overlay: document.getElementById('donateSuccess'),
        charged: document.getElementById('donateCharged'),
        impact: document.getElementById('donateImpact'),
        txnText: document.getElementById('donateTxnText'),
        close: document.getElementById('donateCloseBtn'),
    };
    // Prepare confetti canvas (initialize when modal opens so size isn't 0x0)
    const confettiCanvas = document.getElementById('donateConfetti');
    let fireConfetti = null;
    function ensureConfettiReady() {
        if (!window.confetti || !confettiCanvas) return null;
        const overlayEl = document.getElementById('donateSuccess');
        const w = overlayEl ? overlayEl.clientWidth : window.innerWidth;
        const h = overlayEl ? overlayEl.clientHeight : window.innerHeight;
        confettiCanvas.width = w;
        confettiCanvas.height = h;
        fireConfetti = window.confetti.create(confettiCanvas, { resize: false, useWorker: true });
        return fireConfetti;
    }

    const state = {
		view: 'start',
		donationType: null, // 'oneTime' | 'recurring'
		amount: 0,
		otCreditsApplied: 0,
		userCoversFee: false,
        hasCredits: true,
		cadence: null, // 'monthly' | 'weekly' | 'semiMonthly'
		monthlyDay: null,
		weeklyInterval: 1,
		weeklyStart: null,
		employerCoversFee: false,
        matchEdited: false,
        note: '',
        anonymous: false,
        fundingMethod: 'bankSaved', // 'bankSaved' | 'bankAdd' | 'gsa' | 'card'
        gsaBalance: 100,
        cardInfoAdded: false,
	};
    let isChooseOpen = false;

    function updateHeaderForView() {
        if (!header) return;
        // Show back button only on one-time credits confirmation
        if (buttons.backToDonation) {
            buttons.backToDonation.classList.toggle('hidden', !(state.view === 'oneTimeConfirm' || state.view === 'oneTimeFunding'));
        }
        // Header checkout visibility/label
        if (buttons.checkout) {
            // Show header checkout only on funding view; hide elsewhere
            const shouldShow = state.view === 'oneTimeFunding';
            buttons.checkout.classList.toggle('hidden', !shouldShow);
            buttons.checkout.disabled = false;
        }
    }

    function show(view) {
		Object.values(views).forEach((el) => el.classList.add('hidden'));
		views[view].classList.remove('hidden');
		state.view = view;
		updateHeaderCta();
        // Hide header on start screen or when modal is open
        if (header) header.classList.toggle('hidden', view === 'start' || isChooseOpen);
        updateHeaderForView();
        // Keep main content centered always; toggle the floating receipt panel separately
        if (rightAside) {
            if (view === 'start') {
                rightAside.classList.add('hidden');
            } else if (view === 'oneTime') {
                rightAside.classList.remove('hidden');
            } else if (view === 'oneTimeConfirm' || view === 'oneTimeFunding') {
                rightAside.classList.add('hidden');
                rightAside.style.display = 'none';
            }
        }
        // Ensure match card is shown on one-time and recurring screens from the start
        positionLeftMatchCard();
        // Funding-specific visibility fixes
        if (view === 'oneTimeFunding') {
            if (header) header.classList.remove('hidden');
            if (rightAside) { rightAside.classList.add('hidden'); rightAside.style.display = 'none'; }
            if (summary.card) { summary.card.classList.add('hidden'); summary.card.style.display = 'none'; }
        } else {
            if (rightAside) rightAside.style.display = '';
            if (summary.card) summary.card.style.display = '';
        }
        updateProgressBar();
	}

    function openChooseModal() {
        const overlay = document.getElementById('view-choose');
        if (!overlay) return;
        isChooseOpen = true;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        if (header) header.classList.add('hidden');
        // ensure progress is hidden while choosing
        if (progress.container) progress.container.classList.add('hidden');
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
        // refresh progress visibility after closing modal
        updateProgressBar();
        // reset selection when closing
        state.donationType = null;
        buttons.chooseContinue.disabled = true;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
    }

    function updateHeaderCta() {
        let enabled = false;
        if (state.view === 'recurring') enabled = canProceedRecurring();
        if (state.view === 'oneTime') enabled = canProceedOneTime();
        if (buttons.checkout) buttons.checkout.disabled = !enabled;
    }

    function setProgress(pct) {
        if (!progress.fill) return;
        const clamped = Math.max(0, Math.min(100, Math.round(pct)));
        progress.fill.style.width = clamped + '%';
        progress.fill.setAttribute('aria-valuenow', String(clamped));
    }

    function updateProgressBar() {
        if (!progress.container) return;
        const shouldShow = (state.view === 'oneTime' || state.view === 'oneTimeConfirm' || state.view === 'oneTimeFunding') && !isChooseOpen;
        progress.container.classList.toggle('hidden', !shouldShow);
        if (!shouldShow) return;
        // Credits-confirmation screen is always complete
        if (state.view === 'oneTimeConfirm') {
            setProgress(100);
            return;
        }
        if (state.view === 'oneTimeFunding') {
            setProgress(75);
            return;
        }
        // One-time screen always shows 50%, regardless of selections
        setProgress(50);
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
        // keep progress in sync with pledge presence
        updateProgressBar();
        // Determine visibility of summary
        const hasSelection = (state.view === 'oneTime' && ((state.otCreditsApplied || 0) > 0 || (state.amount || 0) > 0))
            || (state.view === 'recurring');
        const showPanel = (state.view !== 'oneTimeFunding') && (hasSelection || state.view === 'confirmation');
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
                // Render as a single grouped container to emphasize relation
                const group = document.createElement('div');
                group.className = 'rounded-md border border-gray-200 bg-white overflow-hidden';
                const addRow = (label, sub, amount, extraClass='') => {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between p-3 ' + extraClass;
                    const left = document.createElement('div');
                    const t = document.createElement('div'); t.className = 'font-medium text-zinc-900'; t.textContent = label;
                    const s = document.createElement('div'); s.className = 'text-xs text-gray-500'; s.textContent = sub;
                    left.appendChild(t); left.appendChild(s);
                    const right = document.createElement('div'); right.className = 'font-medium'; right.textContent = toDollar(amount);
                    if (label.includes('match')) right.classList.add('text-emerald-700');
                    row.appendChild(left); row.appendChild(right);
                    return row;
                };
                group.appendChild(addRow('My donation', 'This is your portion of this donation', pledge, 'border-b border-gray-200'));
                group.appendChild(addRow('CBC Capital match', 'Your company is matching your pledge', matchFromCompany));
                summary.itemization.appendChild(group);
                itemCount += 2;
            }

            // creditsNote removed from summary panel per updated UX
        }
        updateHeaderCta();
    }

    function renderOneTimeConfirm() {
        if (!views.oneTimeConfirm) return;
        // Compute credits selected
        let totalCredits = 0;
        let count = 0;
        if (reviewEls.list) reviewEls.list.innerHTML = '';
        inputs.creditRows().forEach((row) => {
            const enabled = row.querySelector('.credit-enable').checked;
            const input = row.querySelector('.credit-input');
            const labelEl = row.querySelector('label span');
            const name = labelEl ? labelEl.querySelector('.font-medium')?.textContent || labelEl.textContent : 'Donation credit';
            const val = enabled ? (parseFloat(input.value) || 0) : 0;
            if (enabled && val > 0) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = name.trim();
                const right = document.createElement('div'); right.className = 'text-[14px] text-emerald-700 font-medium'; right.textContent = toDollar(val);
                item.appendChild(left); item.appendChild(right);
                reviewEls.list.appendChild(item);
                totalCredits += val;
                count++;
            }
        });
        // Title and totals
        if (reviewEls.title) reviewEls.title.textContent = `Let's review your ${toDollar(totalCredits)} donation to Team Rubicon`;
        if (reviewEls.total) reviewEls.total.textContent = toDollar(totalCredits);
        if (reviewEls.totalOrg) reviewEls.totalOrg.textContent = toDollar(totalCredits);
        if (reviewEls.txnCount) reviewEls.txnCount.textContent = String(count);
        const dueEl = document.getElementById('reviewDue');
        if (dueEl) dueEl.textContent = toDollar(0);
        // Initialize note/anon
        if (reviewEls.note) reviewEls.note.value = state.note || '';
        if (reviewEls.anonymous) reviewEls.anonymous.checked = !!state.anonymous;
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

    // Funding fee math
    function computeFundingFees(amount, method, coverFixed, includeCardPercent) {
        const fixedDisplay = 0.50; // always show as positive in summary row
        const card = includeCardPercent && method === 'card' ? amount * 0.029 : 0; // percent portion (always positive)
        const dueFee = (coverFixed ? 0.50 : 0) + card; // what the user actually pays in fees
        return { fixedDisplay, card, dueFee };
    }

    function renderFunding() {
        // Determine selected method directly from DOM to avoid stale state
        const selected = document.querySelector('input[name="fundingMethod"]:checked');
        if (selected && selected.value) state.fundingMethod = selected.value;
        const pledge = state.amount || 0;
        if (fundingEls.amountLabel) fundingEls.amountLabel.textContent = toDollar(pledge);
        if (fundingEls.gsaBalanceLabel) fundingEls.gsaBalanceLabel.textContent = toDollar(state.gsaBalance);
        const coverFee = !!(fundingEls.coverFee && fundingEls.coverFee.checked);
        // Card processing fee cannot be waived; only the fixed fee is waived
        const includeCardPct = state.fundingMethod === 'card';
        const fees = computeFundingFees(pledge, state.fundingMethod, coverFee, includeCardPct);
        if (fundingEls.balance) fundingEls.balance.textContent = toDollar(pledge);
        if (fundingEls.feeFixed) fundingEls.feeFixed.textContent = toDollar(fees.fixedDisplay);
        if (fundingEls.feeCardRow) fundingEls.feeCardRow.classList.toggle('hidden', !includeCardPct);
        if (fundingEls.feeCard) fundingEls.feeCard.textContent = toDollar(fees.card);
        const totalDue = pledge + fees.dueFee;
        if (fundingEls.total) fundingEls.total.textContent = toDollar(totalDue);
        if (fundingEls.donationRow) fundingEls.donationRow.textContent = toDollar(pledge);
        // Show contextual action buttons
        const addBankWrap = document.getElementById('addBankWrap');
        const addCardWrap = document.getElementById('addCardWrap');
        if (addBankWrap) addBankWrap.classList.toggle('hidden', state.fundingMethod !== 'bankAdd');
        if (addCardWrap) addCardWrap.classList.toggle('hidden', state.fundingMethod !== 'card');
        // Update card button label and added indicator based on state
        const cardBtn = document.getElementById('addCardBtn');
        const cardAdded = document.getElementById('cardAdded');
        if (cardBtn) {
            const label = cardBtn.querySelector && cardBtn.querySelector('span');
            if (label) label.textContent = state.cardInfoAdded ? 'Edit payment info' : 'Add payment info';
        }
        if (cardAdded) cardAdded.classList.toggle('hidden', !state.cardInfoAdded);
        // Groundswell insufficient
        const insufficient = state.fundingMethod === 'gsa' && state.gsaBalance < pledge;
        if (fundingEls.gsaError) fundingEls.gsaError.classList.toggle('hidden', !insufficient);
        // Toggle header cta
        const canContinue = !insufficient;
        if (buttons.checkout) buttons.checkout.disabled = !canContinue;
        const sideBtn = document.getElementById('checkoutBtnSide');
        sideBtn && (sideBtn.disabled = !canContinue);
        // Ensure side panel is hidden on funding screen
        summary.card && summary.card.classList.add('hidden');
        rightAside && rightAside.classList.add('hidden');
        // Ensure header is visible on funding screen
        header && header.classList.remove('hidden');
        updateProgressBar();
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
    buttons.startDonate.addEventListener('click', () => { state.hasCredits = true; openChooseModal(); });
    buttons.startDonateNoCredits && buttons.startDonateNoCredits.addEventListener('click', () => { state.hasCredits = false; show('oneTime'); toggleCreditsUI(); recomputeSummary(); });
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
        if (state.view === 'oneTimeFunding') {
            // Proceed to pledge/match confirmation
            show('oneTimePledgeConfirm');
            renderPledgeConfirm();
            return;
        }
        if (state.view === 'oneTime' && canProceedOneTime()) {
            const credits = state.otCreditsApplied || 0;
            const pledgeOk = state.amount >= 5;
            if (!pledgeOk && credits > 0) {
                // Credits-only confirmation flow
                show('oneTimeConfirm');
                renderOneTimeConfirm();
                // Hide receipt panel explicitly
                summary.card && summary.card.classList.add('hidden');
                rightAside && rightAside.classList.add('hidden');
                updateProgressBar();
                return;
            }
            // Pledge path → funding screen
            show('oneTimeFunding');
            // Ensure header visible and progress at 75%
            header && header.classList.remove('hidden');
            renderFunding();
            updateProgressBar();
            return;
        }
    }
    buttons.checkout && buttons.checkout.addEventListener('click', triggerCheckout);
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

    // Modal selection cards
    const chooseContainer = document.getElementById('view-choose');
    function handleSelectCard(cardEl) {
        if (!cardEl || !chooseContainer || chooseContainer.classList.contains('hidden')) return;
        state.donationType = cardEl.getAttribute('data-type');
        if (buttons.chooseContinue) buttons.chooseContinue.disabled = false;
        Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((c) => c.classList.remove('selected'));
        cardEl.classList.add('selected');
    }
    Array.from(document.querySelectorAll('#view-choose .select-card')).forEach((card) => {
        card.addEventListener('click', (e) => { e.stopPropagation(); handleSelectCard(card); });
    });

    const chooseCloseBtn = document.getElementById('chooseCloseBtn');
    const chooseCancelBtn = document.getElementById('chooseCancelBtn');
    chooseCloseBtn && chooseCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); closeChooseModal(); });
    chooseCancelBtn && chooseCancelBtn.addEventListener('click', (e) => { e.stopPropagation(); closeChooseModal(); });

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
        if (selected === 'oneTime') { show('oneTime'); toggleCreditsUI(); }
        if (selected === 'recurring') show('recurring');
        recomputeSummary();
    });

    function toggleCreditsUI() {
        const banner = document.getElementById('creditsBanner');
        const card = document.getElementById('creditsCardContainer');
        if (banner) banner.classList.toggle('hidden', !state.hasCredits);
        if (card) card.classList.toggle('hidden', !state.hasCredits);
    }

    // Header back to donation
    buttons.backToDonation && buttons.backToDonation.addEventListener('click', () => {
        show('oneTime');
        recomputeSummary();
        updateProgressBar();
    });

    // Funding interactions
    const fundingView = document.getElementById('view-oneTimeFunding');
    function handleFundingMethodEvent() {
        // Re-render after the browser updates the checked state
        setTimeout(renderFunding, 0);
    }
    if (fundingView) {
        ['change','input','click'].forEach((ev) => fundingView.addEventListener(ev, handleFundingMethodEvent));
    }
    fundingEls.coverFee && fundingEls.coverFee.addEventListener('change', () => renderFunding());
    // Switch to bank quick link
    document.getElementById('switchToBankLink')?.addEventListener('click', () => {
        const addBank = document.querySelector('input[name="fundingMethod"][value="bankSaved"]');
        if (addBank) {
            addBank.checked = true;
            state.fundingMethod = 'bankSaved';
            renderFunding();
        }
    });

    // Center continue button mirrors header action
    document.getElementById('fundingContinueBtn')?.addEventListener('click', () => {
        if (buttons.checkout) {
            buttons.checkout.click();
        } else {
            // fallback: proceed
            triggerCheckout();
        }
    });

    function renderPledgeConfirm() {
        header && header.classList.remove('hidden');
        updateProgressBar();
        // Build list
        if (pledgeConfirmEls.list) pledgeConfirmEls.list.innerHTML = '';
        let txn = 0; let total = 0;
        // credits
        inputs.creditRows().forEach((row) => {
            const enabled = row.querySelector('.credit-enable').checked;
            const input = row.querySelector('.credit-input');
            const labelEl = row.querySelector('label span');
            const name = labelEl ? labelEl.querySelector('.font-medium')?.textContent || labelEl.textContent : 'Donation credit';
            const val = enabled ? (parseFloat(input.value) || 0) : 0;
            if (enabled && val > 0) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = name.trim();
                const right = document.createElement('div'); right.className = 'text-[14px] text-emerald-700 font-medium'; right.textContent = toDollar(val);
                item.appendChild(left); item.appendChild(right);
                pledgeConfirmEls.list.appendChild(item);
                total += val; txn++;
            }
        });
        const pledge = state.amount || 0;
        if (pledge > 0) {
            // pledge and match
            const addRow = (label, amount) => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = label;
                const right = document.createElement('div'); right.className = 'text-[14px] font-medium'; right.textContent = toDollar(amount);
                row.appendChild(left); row.appendChild(right); return row;
            };
            const matchAmt = pledge; // 1x default behavior for prototype
            // Match first (green), then my donation
            {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between px-4 py-2';
                const left = document.createElement('div'); left.className = 'text-[14px]'; left.textContent = 'CBC Capital match';
                const right = document.createElement('div'); right.className = 'text-[14px] text-emerald-700 font-medium'; right.textContent = toDollar(matchAmt);
                row.appendChild(left); row.appendChild(right);
                pledgeConfirmEls.list.appendChild(row);
            }
            pledgeConfirmEls.list.appendChild(addRow('My donation', pledge));
            total += pledge + matchAmt; txn += 2;
        }
        if (pledgeConfirmEls.total) pledgeConfirmEls.total.textContent = toDollar(total);
        if (pledgeConfirmEls.txn) pledgeConfirmEls.txn.textContent = String(txn);
        // Pay method
        if (pledgeConfirmEls.payMethod) {
            let label = '';
            if (state.fundingMethod === 'bankSaved') label = 'Chase -XXXX';
            if (state.fundingMethod === 'bankSaved2') label = 'Wells Fargo -1234';
            if (state.fundingMethod === 'bankAdd') label = 'Bank account';
            if (state.fundingMethod === 'gsa') label = 'Groundswell Giving Account';
            if (state.fundingMethod === 'card') label = 'Card via Stripe';
            pledgeConfirmEls.payMethod.textContent = label;
        }
        // Due and CTA
        const coverFixed = !!(fundingEls.coverFee && fundingEls.coverFee.checked);
        const includeCardPct = state.fundingMethod === 'card';
        const fees = computeFundingFees(pledge, state.fundingMethod, coverFixed, includeCardPct);
        const due = pledge + fees.dueFee;
        if (pledgeConfirmEls.due) pledgeConfirmEls.due.textContent = toDollar(due);
        if (pledgeConfirmEls.title) pledgeConfirmEls.title.textContent = `Let's review your ${toDollar(total)} donation to Team Rubicon`;
        if (pledgeConfirmEls.donateBtn) pledgeConfirmEls.donateBtn.querySelector('span').textContent = `Donate and pay ${toDollar(due)}`;
        // Note/anon defaults from state
        if (pledgeConfirmEls.note) pledgeConfirmEls.note.value = state.note || '';
        if (pledgeConfirmEls.anonymous) pledgeConfirmEls.anonymous.checked = !!state.anonymous;
    }

    pledgeConfirmEls.donateBtn && pledgeConfirmEls.donateBtn.addEventListener('click', () => {
        // Reuse existing success modal flow with due amount
        const dueText = pledgeConfirmEls.due ? pledgeConfirmEls.due.textContent : '$0.00';
        if (successEls.charged) successEls.charged.textContent = `You were charged ${dueText}`;
        openSuccessModal();
    });
    // Open modals
    document.getElementById('addBankBtn')?.addEventListener('click', () => {
        const m = document.getElementById('modalPlaid');
        if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    });
    document.getElementById('modalPlaidClose')?.addEventListener('click', () => {
        const m = document.getElementById('modalPlaid');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        // Show the second saved bank account option
        const sb2 = document.getElementById('savedBank2Wrap');
        if (sb2) {
            sb2.classList.remove('hidden');
            // select it
            const rb = sb2.querySelector('input[type="radio"]');
            if (rb) { rb.checked = true; state.fundingMethod = rb.value; }
            renderFunding();
        }
    });
    document.getElementById('addCardBtn')?.addEventListener('click', () => {
        const m = document.getElementById('modalStripe');
        if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    });
    document.getElementById('modalStripeClose')?.addEventListener('click', () => {
        const m = document.getElementById('modalStripe');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        // Indicate payment info added
        state.cardInfoAdded = true;
        renderFunding();
    });

    // Delegated safety net (in case buttons are re-rendered)
    document.addEventListener('click', (e) => {
        const openPlaid = e.target && (e.target.id === 'addBankBtn' || e.target.closest && e.target.closest('#addBankBtn'));
        if (openPlaid) {
            const m = document.getElementById('modalPlaid');
            if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
        }
        const openStripe = e.target && (e.target.id === 'addCardBtn' || e.target.closest && e.target.closest('#addCardBtn'));
        if (openStripe) {
            const m = document.getElementById('modalStripe');
            if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
        }
        const closePlaid = e.target && (e.target.id === 'modalPlaidClose' || e.target.closest && e.target.closest('#modalPlaidClose'));
        if (closePlaid) {
            const m = document.getElementById('modalPlaid');
            if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
            const sb2 = document.getElementById('savedBank2Wrap');
            if (sb2) sb2.classList.remove('hidden');
        }
        const closeStripe = e.target && (e.target.id === 'modalStripeClose' || e.target.closest && e.target.closest('#modalStripeClose'));
        if (closeStripe) {
            const m = document.getElementById('modalStripe');
            if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
            state.cardInfoAdded = true;
            renderFunding();
        }
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
    const matchAmountEl = document.getElementById('matchAmountInput');
    matchAmountEl?.addEventListener('input', () => {
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
    // Close edit on Enter
    matchAmountEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const display = document.getElementById('matchDisplay');
            const inputGroup = document.getElementById('matchInputGroup');
            if (display && inputGroup) {
                inputGroup.classList.add('hidden');
                display.classList.remove('hidden');
            }
        }
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

inputs.userCoversFee && inputs.userCoversFee.addEventListener('change', () => {
    state.userCoversFee = inputs.userCoversFee.checked;
    recomputeSummary();
});

    // Note and anonymous
    reviewEls.note && reviewEls.note.addEventListener('input', () => { state.note = reviewEls.note.value; });
    reviewEls.anonymous && reviewEls.anonymous.addEventListener('change', () => { state.anonymous = reviewEls.anonymous.checked; });

    // Donate submit → show success modal with total impact
    function openSuccessModal() {
        const inPledgeConfirm = views.oneTimePledgeConfirm && !views.oneTimePledgeConfirm.classList.contains('hidden');
        const impactText = inPledgeConfirm
            ? (pledgeConfirmEls.total ? pledgeConfirmEls.total.textContent : toDollar(0))
            : (reviewEls.totalOrg ? reviewEls.totalOrg.textContent : toDollar(0));
        const amountDue = inPledgeConfirm
            ? (pledgeConfirmEls.due ? pledgeConfirmEls.due.textContent : toDollar(0))
            : toDollar(0);
        // Show/hide charged line
        if (successEls.charged) {
            if (amountDue === toDollar(0)) {
                successEls.charged.classList.add('hidden');
            } else {
                successEls.charged.textContent = `You were charged ${amountDue}`;
                successEls.charged.classList.remove('hidden');
            }
        }
        if (successEls.impact && typeof impactText === 'string') successEls.impact.textContent = impactText;
        if (successEls.txnText) {
            const countText = inPledgeConfirm ? (pledgeConfirmEls.txn ? pledgeConfirmEls.txn.textContent : '1') : (reviewEls.txnCount ? reviewEls.txnCount.textContent : '1');
            const count = parseInt(countText || '1', 10) || 1;
            successEls.txnText.textContent = `This will appear as ${count} transaction${count === 1 ? '' : 's'} in your giving history`;
        }
        if (successEls.overlay) {
            // Hide everything behind; keep overlay dark
            document.querySelector('main')?.classList.add('hidden');
            document.getElementById('siteHeader')?.classList.add('hidden');
            successEls.overlay.classList.remove('hidden');
            successEls.overlay.classList.add('flex');
        }
        // confetti burst (on our canvas behind the card)
        const fc = ensureConfettiReady();
        if (fc) {
            fc({ particleCount: 140, spread: 70, origin: { x: 0.5, y: 0.15 } });
            setTimeout(() => fc({ particleCount: 100, spread: 100, origin: { x: 0.5, y: 0.3 } }), 250);
        }
    }
    reviewEls.donateSubmit && reviewEls.donateSubmit.addEventListener('click', (e) => { e.preventDefault(); openSuccessModal(); });
    // Defensive: delegate in case the button is re-rendered
    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('#donateSubmit');
        if (btn) {
            e.preventDefault();
            openSuccessModal();
        }
    });
    successEls.close && successEls.close.addEventListener('click', () => {
        if (successEls.overlay) {
            successEls.overlay.classList.add('hidden');
            successEls.overlay.classList.remove('flex');
        }
        // Return to start screen with cleared state
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.classList.remove('hidden');
        const headerEl = document.getElementById('siteHeader');
        if (headerEl) headerEl.classList.add('hidden');
        // Reset minimal state
        state.view = 'start';
        state.donationType = null;
        state.amount = 0;
        state.otCreditsApplied = 0;
        state.matchEdited = false;
        state.note = '';
        state.anonymous = false;
        show('start');
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
summary.employerCoversFee && summary.employerCoversFee.addEventListener('change', () => {
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
        if (summary.employerCoversFee) summary.employerCoversFee.checked = false;
		recomputeSummary();
	});

    // Initial
	show('start');
	recomputeSummary();
    updateProgressBar();
    window.addEventListener('resize', positionLeftMatchCard);
    window.addEventListener('scroll', positionLeftMatchCard, { passive: true });
})();


