"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { produce } from "immer";
import { HOME_SCREEN_APPS, DOCK_APPS, findApp } from "@/lib/apps";
import { WIDGETS } from "@/lib/widgets";
import { arrayMove } from "@dnd-kit/sortable";

export type WidgetSize = "2x2" | "2x4" | "4x4";

export interface GridItem {
  id: string;
  type: "app" | "widget";
  appId?: string; // for type 'app'
  widgetType?: string; // for type 'widget'
  size?: WidgetSize; // for type 'widget'
}

export interface Page {
  id: string;
  items: GridItem[];
}

export interface HomeScreenState {
  pages: Page[];
  dockItems: GridItem[];
}

const MAX_DOCK_ITEMS = 4;
const COLUMNS = 4;
const ROWS = 6;
const MAX_PAGE_CAPACITY = COLUMNS * ROWS;

const getItemSize = (item: GridItem): number => {
  if (item.type === "widget" && item.size) {
    const [w, h] = item.size.split("x").map(Number);
    return w * h;
  }
  return 1; // Apps are 1x1
};

const getPageCapacity = (items: GridItem[]): number => {
  return items.reduce((sum, item) => sum + getItemSize(item), 0);
};

const getInitialState = (): HomeScreenState => {
  if (typeof window === "undefined") return { pages: [], dockItems: [] };

  const savedState = localStorage.getItem("homeScreenState");
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      if (Array.isArray(parsed.pages) && Array.isArray(parsed.dockItems)) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse homeScreenState from localStorage", e);
    }
  }

  // Default initial state
  const firstPageApps = HOME_SCREEN_APPS.slice(0, 16);

  const page1: Page = {
    id: "page-1",
    items: [
      {
        id: "widget-profile-initial",
        type: "widget",
        widgetType: "profile",
        size: "2x2",
      },
      {
        id: "widget-calendar-initial",
        type: "widget",
        widgetType: "calendar",
        size: "2x2",
      },
      ...firstPageApps
        .filter(
          (app) => !["phone", "safari", "messages", "spotify"].includes(app.id),
        )
        .slice(0, 16)
        .map((app) => ({
          id: `app-${app.id}-${Math.random()}`,
          type: "app" as const,
          appId: app.id,
        })),
    ],
  };

  const remainingApps = HOME_SCREEN_APPS.filter(
    (app) => !firstPageApps.includes(app),
  );

  const page2: Page = {
    id: "page-2",
    items: remainingApps.slice(0, 24).map((app) => ({
      id: `app-${app.id}-${Math.random()}`,
      type: "app" as const,
      appId: app.id,
    })),
  };

  const initialDockItems = DOCK_APPS.map((app) => ({
    id: `app-${app.id}-dock-${Math.random()}`,
    type: "app" as const,
    appId: app.id,
  }));

  return { pages: [page1, page2], dockItems: initialDockItems };
};

export interface FindResult {
  item: GridItem;
  containerId: string; // 'dock' or page id
  pageIndex?: number;
  itemIndex: number;
}

interface HomeScreenContextType {
  pages: Page[];
  dockItems: GridItem[];
  visiblePages: boolean[];
  setVisiblePages: React.Dispatch<React.SetStateAction<boolean[]>>;
  addApp: (appId: string) => void;
  addWidget: (widgetType: string, pageIndex: number) => void;
  removeItem: (itemId: string) => void;
  findItem: (itemId: string) => FindResult | null;
  updateWidget: (
    itemId: string,
    updates: { type?: string; size?: WidgetSize },
  ) => boolean;
  moveItem: (activeId: string, overId: string, overData: any) => boolean;
  lastAddedPageIndex: number | null;
  acknowledgeNavigation: () => void;
}

const HomeScreenContext = createContext<HomeScreenContextType | undefined>(
  undefined,
);

export const HomeScreenProvider = ({ children }: { children: ReactNode }) => {
  const [homeScreenState, setHomeScreenState] = useState<HomeScreenState>({
    pages: [],
    dockItems: [],
  });
  const [visiblePages, setVisiblePages] = useState<boolean[]>([]);
  const [lastAddedPageIndex, setLastAddedPageIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const initialState = getInitialState();
    setHomeScreenState(initialState);
    setVisiblePages(Array(initialState.pages.length).fill(true));
  }, []);

  useEffect(() => {
    if (
      homeScreenState.pages.length > 0 ||
      homeScreenState.dockItems.length > 0
    ) {
      localStorage.setItem("homeScreenState", JSON.stringify(homeScreenState));
    }
  }, [homeScreenState]);

  const acknowledgeNavigation = useCallback(
    () => setLastAddedPageIndex(null),
    [],
  );

  const findItem = useCallback(
    (itemId: string): FindResult | null => {
      for (let i = 0; i < homeScreenState.pages.length; i++) {
        const page = homeScreenState.pages[i];
        const itemIndex = page.items.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          return {
            item: page.items[itemIndex],
            containerId: page.id,
            pageIndex: i,
            itemIndex,
          };
        }
      }
      const dockItemIndex = homeScreenState.dockItems.findIndex(
        (item) => item.id === itemId,
      );
      if (dockItemIndex !== -1) {
        return {
          item: homeScreenState.dockItems[dockItemIndex],
          containerId: "dock",
          itemIndex: dockItemIndex,
        };
      }
      return null;
    },
    [homeScreenState],
  );

  const moveItem = useCallback(
    (activeId: string, overId: string, overData: any): boolean => {
      let success = false;
      setHomeScreenState(
        produce((draft) => {
          const findItemLocation = (d: typeof draft, id: string) => {
            const dockIndex = d.dockItems.findIndex((item) => item.id === id);
            if (dockIndex !== -1) {
              return {
                container: d.dockItems,
                containerId: "dock",
                index: dockIndex,
              };
            }
            for (const page of d.pages) {
              const itemIndex = page.items.findIndex((item) => item.id === id);
              if (itemIndex !== -1) {
                return {
                  container: page.items,
                  containerId: page.id,
                  index: itemIndex,
                };
              }
            }
            return null;
          };

          const activeLocation = findItemLocation(draft, activeId);
          if (!activeLocation) return;
          const {
            container: sourceContainer,
            containerId: sourceContainerId,
            index: sourceIndex,
          } = activeLocation;

          const overIsContainer = overData?.type === "container";
          const overLocation = overIsContainer
            ? null
            : findItemLocation(draft, overId);
          const destContainerId = overIsContainer
            ? overId
            : overLocation?.containerId;
          if (!destContainerId) return;

          if (sourceContainerId === destContainerId) {
            if (!overLocation) return;
            const newItems = arrayMove(
              sourceContainer,
              sourceIndex,
              overLocation.index,
            );
            if (sourceContainerId === "dock") {
              draft.dockItems = newItems;
            } else {
              const page = draft.pages.find((p) => p.id === sourceContainerId)!;
              page.items = newItems;
            }
            success = true;
          } else {
            const [movedItem] = sourceContainer.splice(sourceIndex, 1);
            const destContainer =
              destContainerId === "dock"
                ? draft.dockItems
                : draft.pages.find((p) => p.id === destContainerId)?.items;
            if (!destContainer) {
              sourceContainer.splice(sourceIndex, 0, movedItem);
              return;
            }

            if (movedItem.type === "widget" && destContainerId === "dock") {
              sourceContainer.splice(sourceIndex, 0, movedItem);
              return;
            }
            if (
              destContainerId !== "dock" &&
              getPageCapacity(destContainer) + getItemSize(movedItem) >
                MAX_PAGE_CAPACITY
            ) {
              sourceContainer.splice(sourceIndex, 0, movedItem);
              return;
            }

            if (overLocation) {
              // Dropped on an item
              if (
                destContainerId === "dock" &&
                destContainer.length >= MAX_DOCK_ITEMS
              ) {
                const [swappedItem] = destContainer.splice(
                  overLocation.index,
                  1,
                  movedItem,
                );
                sourceContainer.push(swappedItem);
              } else {
                destContainer.splice(overLocation.index, 0, movedItem);
              }
            } else {
              // Dropped on a container's background
              if (
                destContainerId === "dock" &&
                destContainer.length >= MAX_DOCK_ITEMS
              ) {
                sourceContainer.splice(sourceIndex, 0, movedItem);
                return;
              }
              destContainer.push(movedItem);
            }
            success = true;
          }
        }),
      );
      return success;
    },
    [],
  );

  const addApp = useCallback(
    (appId: string) => {
      const app = findApp(appId);
      if (!app) return;

      const alreadyInDock = homeScreenState.dockItems.some(
        (item) => item.type === "app" && item.appId === appId,
      );

      if (alreadyInDock) {
        return;
      }

      const existingPageIndex = homeScreenState.pages.findIndex((page) =>
        page.items.some((item) => item.type === "app" && item.appId === appId),
      );

      if (existingPageIndex !== -1) {
        setLastAddedPageIndex(existingPageIndex);
        return;
      }

      let pageIndex = -1;
      const newHomeScreenState = produce(homeScreenState, (draft) => {
        const newApp: GridItem = {
          id: `app-${appId}-${Date.now()}`,
          type: "app",
          appId,
        };

        let pageAdded = false;
        const visiblePageIndices = draft.pages
          .map((p, i) => (visiblePages[i] ? i : -1))
          .filter((i) => i !== -1);

        for (const idx of visiblePageIndices) {
          const page = draft.pages[idx];
          if (!page.items) page.items = [];
          if (getPageCapacity(page.items) + 1 <= MAX_PAGE_CAPACITY) {
            page.items.push(newApp);
            pageAdded = true;
            pageIndex = idx;
            break;
          }
        }

        if (!pageAdded) {
          const newPageId = `page-${draft.pages.length + 1}`;
          draft.pages.push({ id: newPageId, items: [newApp] });
          setVisiblePages((vis) => [...vis, true]);
          pageIndex = draft.pages.length - 1;
        }
      });
      setHomeScreenState(newHomeScreenState);
      if (pageIndex !== -1) {
        setLastAddedPageIndex(pageIndex);
      }
    },
    [homeScreenState, visiblePages],
  );

  const addWidget = useCallback(
    (widgetType: string, requestedPageIndex: number): void => {
      const widgetConfig = WIDGETS[widgetType as keyof typeof WIDGETS];
      if (!widgetConfig) return;

      const newWidget: GridItem = {
        id: `widget-${widgetType}-${Date.now()}`,
        type: "widget",
        widgetType,
        size: widgetConfig.defaultSize,
      };

      const visiblePageIndices = homeScreenState.pages
        .map((_, i) => i)
        .filter((i) => visiblePages[i]);

      const indicesToCheck = [
        requestedPageIndex,
        ...visiblePageIndices.filter((i) => i !== requestedPageIndex),
      ].filter((i) => i !== -1 && i < homeScreenState.pages.length);

      for (const idx of indicesToCheck) {
        if (idx >= 0 && homeScreenState.pages[idx]) {
          if (
            getPageCapacity(homeScreenState.pages[idx].items) +
              getItemSize(newWidget) <=
            MAX_PAGE_CAPACITY
          ) {
            setHomeScreenState(
              produce((draft) => {
                draft.pages[idx].items.push(newWidget);
              }),
            );
            setLastAddedPageIndex(idx);
            return;
          }
        }
      }

      // If no space, create a new page
      const newPageIndex = homeScreenState.pages.length;
      const newPage: Page = {
        id: `page-${newPageIndex + 1}`,
        items: [newWidget],
      };
      setHomeScreenState((current) => ({
        ...current,
        pages: [...current.pages, newPage],
      }));
      setVisiblePages((currentVisibility) => [...currentVisibility, true]);
      setLastAddedPageIndex(newPageIndex);
    },
    [homeScreenState, visiblePages],
  );

  const removeItem = useCallback((itemId: string) => {
    const findItemLocation = (
      draft: HomeScreenState,
      itemId: string,
    ): { container: GridItem[]; index: number } | null => {
      const dockIndex = draft.dockItems.findIndex((item) => item.id === itemId);
      if (dockIndex !== -1)
        return { container: draft.dockItems, index: dockIndex };
      for (const page of draft.pages) {
        const itemIndex = page.items.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1)
          return { container: page.items, index: itemIndex };
      }
      return null;
    };

    setHomeScreenState(
      produce((draft) => {
        const itemLocation = findItemLocation(draft, itemId);
        if (itemLocation) {
          itemLocation.container.splice(itemLocation.index, 1);
        }
      }),
    );
  }, []);

  const updateWidget = useCallback(
    (
      itemId: string,
      updates: { type?: string; size?: WidgetSize },
    ): boolean => {
      let success = false;

      setHomeScreenState(
        produce((draft) => {
          let pageIndex = -1;
          let itemIndex = -1;
          draft.pages.find((p, pI) => {
            const iI = p.items.findIndex((i) => i.id === itemId);
            if (iI !== -1) {
              pageIndex = pI;
              itemIndex = iI;
              return true;
            }
            return false;
          });

          if (pageIndex !== -1 && itemIndex !== -1) {
            const page = draft.pages[pageIndex];
            const item = page.items[itemIndex];
            const originalItem = { ...item };

            if (item.type === "widget") {
              const prospectiveItem: GridItem = {
                ...item,
                ...updates,
                type: "widget",
              };
              const tempItems = [...page.items];
              tempItems[itemIndex] = prospectiveItem;

              if (getPageCapacity(tempItems) <= MAX_PAGE_CAPACITY) {
                if (updates.type) {
                  item.widgetType = updates.type;
                  const widgetConfig =
                    WIDGETS[updates.type as keyof typeof WIDGETS];
                  if (
                    widgetConfig &&
                    item.size &&
                    !widgetConfig.supportedSizes.includes(item.size)
                  ) {
                    item.size = widgetConfig.supportedSizes[0];
                  }
                }
                if (updates.size) {
                  const widgetType = item.widgetType;
                  const widgetConfig =
                    WIDGETS[widgetType as keyof typeof WIDGETS];
                  if (
                    widgetConfig &&
                    widgetConfig.supportedSizes.includes(updates.size)
                  ) {
                    item.size = updates.size;
                  }
                }
                success = true;
              } else {
                page.items[itemIndex] = originalItem;
              }
            }
          }
        }),
      );

      return success;
    },
    [],
  );

  const value = useMemo(
    () => ({
      pages: homeScreenState.pages,
      dockItems: homeScreenState.dockItems,
      visiblePages,
      setVisiblePages,
      addApp,
      addWidget,
      removeItem,
      findItem,
      updateWidget,
      lastAddedPageIndex,
      acknowledgeNavigation,
      moveItem,
    }),
    [
      homeScreenState.pages,
      homeScreenState.dockItems,
      visiblePages,
      setVisiblePages,
      addApp,
      addWidget,
      removeItem,
      findItem,
      updateWidget,
      lastAddedPageIndex,
      acknowledgeNavigation,
      moveItem,
    ],
  );

  return React.createElement(HomeScreenContext.Provider, {
    value: value,
    children: children,
  });
};

export const useHomeScreen = () => {
  const context = useContext(HomeScreenContext);
  if (context === undefined) {
    throw new Error("useHomeScreen must be used within a HomeScreenProvider");
  }
  return context;
};
