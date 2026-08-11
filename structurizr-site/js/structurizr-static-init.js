const INTRODUCTION_MODAL_COOKIE_NAME = 'structurizr.static.introductionModal';

    structurizr.workspace = new structurizr.Workspace(JSON.parse(decodeBase64(jsonAsString)));
    structurizr.ui.loadThemes(function() {
        init();
    });

    function init() {
        const embed = getParameter('embed');
        structurizr.ui.initDarkMode('./css/structurizr-static-dark.css');

        structurizr.diagram = new structurizr.ui.Diagram('diagram', false, function () {
            structurizr.diagram.setDarkMode(structurizr.ui.isDarkMode());

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                if (structurizr.ui.getRenderingMode() === structurizr.ui.RENDERING_MODE_SYSTEM) {
                    structurizr.diagram.setDarkMode(structurizr.ui.isDarkMode());
                }
            });

            var diagramIdentifier = getParameter('diagram');
            if (!diagramIdentifier || diagramIdentifier.length === 0) {
                diagramIdentifier = window.location.hash;

                if (!diagramIdentifier || diagramIdentifier.length === 0) {
                    diagramIdentifier = structurizr.workspace.views.configuration.defaultView;

                    if (!diagramIdentifier || diagramIdentifier.length === 0) {
                        diagramIdentifier = structurizr.workspace.getViews()[0].key;
                    }
                }
            }

            window.location.hash = diagramIdentifier;
            hashChanged();

            window.onhashchange = function () {
                hashChanged();
            };
        });

        structurizr.diagram.setEmbedded(embed);

        structurizr.diagram.getPossibleViewportWidth = function() {
            if (structurizr.ui.isFullScreen()) {
                return screen.width;
            } else {
                if (embed) {
                    return window.innerWidth;
                } else {
                    return $('#diagram').innerWidth();
                }
            }
        };

        structurizr.diagram.getPossibleViewportHeight = function() {
            if (structurizr.ui.isFullScreen()) {
                return screen.availHeight;
            } else {
                return window.innerHeight;
            }
        };

        structurizr.diagram.zoomToWidthOrHeight();
        structurizr.diagram.setNavigationEnabled(true);
        structurizr.diagram.onElementDoubleClicked(elementDoubleClicked);
        structurizr.diagram.onRelationshipDoubleClicked(relationshipDoubleClicked);
        structurizr.diagram.setTooltip(tooltip);
        structurizr.diagram.onViewChanged(viewChanged);

        structurizr.scripting = new function() {

            this.isDiagramRendered = function() {
                return structurizr.diagram.isRendered();
            };

            this.exportViews = function(views, options, viewCallback, finishedCallback) {
                structurizr.diagram.exportViews(views, options, viewCallback, finishedCallback);
            };

            this.getViews = function() {
                const views = [];

                structurizr.workspace.getViews().forEach(function(view) {
                    views.push(
                        {
                            key: view.key,
                            name: structurizr.ui.getTitleForView(view),
                            description: view.description ? view.description : '',
                            type: view.type
                        }
                    )
                });

                return views;
            };

            this.getViewKey = function() {
                return structurizr.diagram.getCurrentViewOrFilter().key;
            };

            this.getView = function() {
                return structurizr.diagram.getCurrentViewOrFilter();
            }

            this.changeView = function(viewKey, callback) {
                const view = structurizr.workspace.findViewByKey(viewKey);
                if (view) {
                    changeView(view, callback);
                } else {
                    throw 'A view with the key "' + viewKey + '" could not be found.';
                }
            };

            this.setDarkMode = function(bool) {
                if (bool) {
                    structurizr.ui.setRenderingMode(structurizr.ui.RENDERING_MODE_DARK);
                    structurizr.diagram.setDarkMode(true);
                } else {
                    structurizr.ui.setRenderingMode(structurizr.ui.RENDERING_MODE_LIGHT);
                    structurizr.diagram.setDarkMode(false);
                }
            };
        };

        const perspective = getParameter('perspective');
        if (perspective) {
            structurizr.diagram.setPerspective(perspective);
            tooltip.disable();
            toggleTooltip();
        }

        structurizr.diagram.onkeydown(function (e) {
            const leftArrow = 37;
            const pageUp = 33;
            const rightArrow = 39;
            const pageDown = 34;
            const upArrow = 38;
            const downArrow = 40;

            if (structurizr.diagram.isNavigationEnabled()) {
                if (e.which === leftArrow || e.which === upArrow || e.which === pageUp) {
                    navigateToPreviousDiagram();
                    e.preventDefault();
                } else if (e.which === rightArrow || e.which === downArrow || e.which === pageDown) {
                    navigateToNextDiagram();
                    e.preventDefault();
                }
            }
        });

        structurizr.diagram.onkeypress(function (e) {
            const plus = 43;
            const equals = 61;
            const minus = 45;
            const comma = 44;
            const dot = 46;
            const questionMark = 63;
            const c = 99;
            const d = 100;
            const f = 102;
            const h = 104;
            const i = 105;
            const m = 109;
            const p = 112;
            const t = 116;
            const w = 119;

            if (e.which === comma) {
                if (structurizr.diagram.currentViewIsDynamic() || structurizr.diagram.currentViewHasAnimation()) {
                    structurizr.diagram.stepBackwardInAnimation();
                    e.preventDefault();
                }
            } else if (e.which === dot) {
                if (structurizr.diagram.currentViewIsDynamic() || structurizr.diagram.currentViewHasAnimation()) {
                    structurizr.diagram.stepForwardInAnimation();
                    e.preventDefault();
                }
            } else if (e.which === d) {
                structurizr.diagram.toggleDescription();
                e.preventDefault();
            } else if (e.which === m) {
                structurizr.diagram.toggleMetadata();
                e.preventDefault();
            } else if (e.which === p) {
                openPerspectivesModal();
                e.preventDefault();
            } else if (e.which === plus || e.which === equals) {
                structurizr.diagram.zoomIn();
                e.preventDefault();
            } else if (e.which === minus) {
                structurizr.diagram.zoomOut();
                e.preventDefault();
            } else if (e.which === w) {
                structurizr.diagram.zoomFitWidth();
                e.preventDefault();
            } else if (e.which === h) {
                structurizr.diagram.zoomFitHeight();
                e.preventDefault();
            } else if (e.which === c) {
                structurizr.diagram.zoomFitContent();
                e.preventDefault();
            } else if (e.which === i) {
                if (structurizr.diagram.getCurrentView().type !== structurizr.constants.IMAGE_VIEW_TYPE) {
                    $('#diagramKey').html(structurizr.diagram.exportCurrentDiagramKeyToSVG());
                    $('#keyModal').modal('show');
                }
            } else if (e.which === t) {
                toggleTooltip();
            } else if (e.which === f) {
                structurizr.ui.enterFullScreen('diagram');
            } else if (e.which === questionMark) {
                $('#introductionModal').modal('show');
            }
        });

        document.getElementById('diagram-viewport').addEventListener('wheel', function (event) {
                if (event.ctrlKey === true) {
                    if (event.wheelDelta > 0) {
                        structurizr.diagram.zoomIn(event);
                    } else {
                        structurizr.diagram.zoomOut(event);
                    }

                    event.preventDefault();
                    event.stopPropagation();
                }
            },
            {
                passive: false
            });

        $(window).resize(function () {
            structurizr.diagram.resize();
            structurizr.diagram.zoomToWidthOrHeight();

            if (embed) {
                postDiagramAspectRatioToParentWindow();
            }
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            structurizr.diagram.setDarkMode(structurizr.ui.isDarkMode());
        });

        structurizr.ui.applyWorkspaceLogo();

        const modal = document.getElementById('introductionModal')
        modal.addEventListener('hidden.bs.modal', function (event) {
            const checked = $('#hideIntroductionModalCheckbox').is(':checked');
            if (checked) {
                const maxAge = 60 * 60 * 24 * 365; // 1 year
                document.cookie = INTRODUCTION_MODAL_COOKIE_NAME + '=false; max-age=' + maxAge;
            }
        })

        if (structurizr.workspace.getProperty('structurizr.introduction') !== 'false' && getParameter('introduction') !== 'false') {
            const hideIntroductionModal = document.cookie.indexOf(INTRODUCTION_MODAL_COOKIE_NAME + '=false') > -1;
            if (!hideIntroductionModal) {
                $('#introductionModal').modal('show');
            }
        }
    }

    function postDiagramAspectRatioToParentWindow() {
        window.parent.postMessage({
            src: window.location.toString(),
            context: 'iframe.resize',
            aspectRatio: structurizr.diagram.getAspectRatio(),
            toolbarHeight: 0
        }, '*');
    }

    function getParameter(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function hashChanged() {
        if (window.location.hash) {
            var diagramIdentifier = window.location.hash;
            if (diagramIdentifier && diagramIdentifier.length > 1) {
                diagramIdentifier = decodeURIComponent(diagramIdentifier.substring(1)); // remove the # symbol
            }

            const view = structurizr.workspace.findViewByKey(diagramIdentifier);
            if (view) {
                setTimeout(function() {
                    structurizr.diagram.changeView(view.key, function() {
                    });
                }, 10);
            }
        }
    }

    initQuickNavigation();

    function decodeBase64(str) {
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    function elementDoubleClicked(evt, elementId) {
        const element = structurizr.workspace.findElementById(elementId);
        if (element) {
            const elementUrl = element.url;

            if (evt.altKey === true && elementUrl !== undefined) {
                navigateTo(elementUrl);
                return;
            }

            const options = [];
            var views = [];
            if (element.type === structurizr.constants.SOFTWARE_SYSTEM_ELEMENT_TYPE) {
                if (structurizr.diagram.getCurrentView().type === structurizr.constants.SYSTEM_LANDSCAPE_VIEW_TYPE || structurizr.diagram.getCurrentView().softwareSystemId !== element.id) {
                    views = structurizr.workspace.findSystemContextViewsForSoftwareSystem(element.id);
                    if (views.length === 0) {
                        views = structurizr.workspace.findContainerViewsForSoftwareSystem(element.id);
                    }
                } else if (structurizr.diagram.getCurrentView().type === structurizr.constants.SYSTEM_CONTEXT_VIEW_TYPE) {
                    views = structurizr.workspace.findContainerViewsForSoftwareSystem(element.id);
                }
            } else if (element.type === structurizr.constants.CONTAINER_ELEMENT_TYPE) {
                views = structurizr.workspace.findComponentViewsForContainer(element.id);
            } else if (element.type === structurizr.constants.SOFTWARE_SYSTEM_INSTANCE_ELEMENT_TYPE) {
                views = structurizr.workspace.findSystemContextViewsForSoftwareSystem(element.softwareSystemId);
            } else if (element.type === structurizr.constants.CONTAINER_INSTANCE_ELEMENT_TYPE) {
                views = structurizr.workspace.findComponentViewsForContainer(element.containerId);
            }

            views = views.concat(structurizr.workspace.findDynamicViewsForElement(element.id));
            views = views.concat(structurizr.workspace.findImageViewsForElement(element.id));

            views.forEach(function(view) {
                options.push({
                    value: '#' + view.key,
                    label: structurizr.ui.getTitleForView(view) + ' (#' + view.key + ')'
                });
            });

            if (elementUrl !== undefined) {
                var label = elementUrl;
                if (elementUrl.indexOf('#') === 0) {
                    const key = elementUrl.substring(1);
                    const view = structurizr.workspace.findViewByKey(key);
                    if (view) {
                        label = structurizr.ui.getTitleForView(view) + ' (#' + view.key + ')'
                    }
                }
                options.push({
                    value: elementUrl,
                    label: label
                });
            }

            if (element.properties) {
                Object.keys(element.properties).forEach(function(name) {
                    const value = element.properties[name];
                    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
                        options.push({
                            value: value,
                            label: name
                        })
                    }
                });
            }

            if (options.length === 1) {
                navigateTo(options[0].value);
            } else {
                openNavigationModal(options);
            }
        }
    }

    function navigateTo(url) {
        if (url.indexOf('#') === 0) {
            window.location = url;
        } else {
            window.open(url);
        }
    }

    function navigateToPreviousDiagram() {
        const currentView = structurizr.diagram.getCurrentViewOrFilter();
        const views = structurizr.workspace.getViews();

        var index = views.indexOf(currentView);
        if (index > 0) {
            window.location.hash = '#' + views[index-1].key;
        }
    }

    function navigateToNextDiagram() {
        const currentView = structurizr.diagram.getCurrentViewOrFilter();
        const views = structurizr.workspace.getViews();

        var index = views.indexOf(currentView);
        if (index < views.length -1) {
            window.location.hash = '#' + views[index+1].key;
        }
    }

    function relationshipDoubleClicked(event, relationshipId) {
        const relationship = structurizr.workspace.findRelationshipById(relationshipId);
        if (relationship) {
            const options = [];

            if (relationship.url !== undefined) {
                options.push({
                    value: relationship.url,
                    label: relationship.url
                });
            }

            if (relationship.properties) {
                Object.keys(relationship.properties).forEach(function(name) {
                    const value = relationship.properties[name];
                    if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
                        options.push({
                            value: value,
                            label: name
                        })
                    }
                });
            }

            if (relationship.linkedRelationshipId) {
                const linkedRelationship = structurizr.workspace.findRelationshipById(relationship.linkedRelationshipId);
                if (linkedRelationship.url !== undefined) {
                    options.push({
                        value: linkedRelationship.url,
                        label: linkedRelationship.url
                    });
                }

                if (linkedRelationship.properties) {
                    Object.keys(linkedRelationship.properties).forEach(function(name) {
                        const value = linkedRelationship.properties[name];
                        if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
                            options.push({
                                value: value,
                                label: name
                            })
                        }
                    });
                }
            }

            if (options.length === 1) {
                navigateTo(options[0].value);
            } else {
                openNavigationModal(options);
            }
        }
    }

    function viewChanged(key) {
        const view = structurizr.workspace.findViewByKey(key);

        $('#keyModal').modal('hide');
        configureTooltip(view);

        structurizr.diagram.resize();
        structurizr.diagram.zoomToWidthOrHeight();
    }

    function toggleTooltip() {
        if (tooltip.isEnabled()) {
            tooltip.disable();
        } else {
            tooltip.enable();
        }
    }

    function configureTooltip(view) {
        const STRUCTURIZR_TOOLTIPS_PROPERTY_NAME = 'structurizr.tooltips';
        if (view.properties) {
            if (view.properties[STRUCTURIZR_TOOLTIPS_PROPERTY_NAME] === 'true') {
                tooltip.disable();
                toggleTooltip();
                return;
            } else if (view.properties[STRUCTURIZR_TOOLTIPS_PROPERTY_NAME] === 'false') {
                tooltip.enable();
                toggleTooltip();
                return;
            }
        }

        if (structurizr.workspace.views.configuration.properties) {
            if (structurizr.workspace.views.configuration.properties[STRUCTURIZR_TOOLTIPS_PROPERTY_NAME] === 'true') {
                tooltip.disable();
                toggleTooltip();
                return;
            } else if (structurizr.workspace.views.configuration.properties[STRUCTURIZR_TOOLTIPS_PROPERTY_NAME] === 'false') {
                tooltip.enable();
                toggleTooltip();
                return;
            }
        }
    }

    function initQuickNavigation() {
        structurizr.workspace.getViews().forEach(function(view) {
            const title = structurizr.util.escapeHtml(structurizr.ui.getTitleForView(view));
            quickNavigation.addItem(title + ' <span class="viewKey">(#' + structurizr.util.escapeHtml(view.key) + ')</span>', '#' + structurizr.util.escapeHtml(view.key));
        });

        quickNavigation.onOpen(function() {
            structurizr.diagram.setKeyboardShortcutsEnabled(false);
        });
        quickNavigation.onClose(function() {
            structurizr.diagram.setKeyboardShortcutsEnabled(true);
        });
    }

    function openPerspectivesModal() {
        const perspectiveNames = structurizr.workspace.getPerspectiveNames();

        if (perspectiveNames.length > 0) {
            const options = [
                {
                    label: '(none)',
                    value: ''
                }
            ].concat(perspectiveNames.map(function(name) {
                return {
                    label: name,
                    value: name
                };
            }));

            openNavigationModal(options, structurizr.diagram.getPerspective(), function(perspective) {
                if (perspective.length > 0) {
                    structurizr.diagram.showPerspective(perspective);
                    tooltip.disable();
                    toggleTooltip();
                } else {
                    structurizr.diagram.clearPerspective();
                    tooltip.enable();
                    toggleTooltip();
                }
            });
        }
    }
