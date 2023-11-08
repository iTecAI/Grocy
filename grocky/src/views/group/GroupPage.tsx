import { useParams } from "react-router-dom";
import { useServerEvent } from "../../util/events";
import { useApi, useReady, useSession } from "../../util/api";
import { useCallback, useEffect, useState } from "react";
import { ListType } from "../../types/list";
import { User } from "../../types/auth";
import { GroupType } from "../../types/group";
import {
    ActionIcon,
    Card,
    Divider,
    Group,
    Loader,
    SimpleGrid,
    Stack,
    TextInput,
    Box,
    Text,
} from "@mantine/core";
import "./groups.scss";
import { MdList, MdSearch, MdSettings } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useModals } from "../modals";
import { ListCard } from "../../components/ListCard/ListCard";

export function GroupPage() {
    const { groupId } = useParams();
    const { groups } = useApi();
    const ready = useReady();
    const session = useSession();
    const { t } = useTranslation();

    const [lists, setLists] = useState<ListType[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [group, setGroup] = useState<GroupType | null>(null);

    const loadData = useCallback(async () => {
        setGroup(groupId ? await groups.get_group(groupId) : null);
    }, [groupId]);

    const loadLists = useCallback(async () => {
        setLists(groupId ? await groups.get_group_lists(groupId) : []);
    }, [groupId]);

    const loadMembers = useCallback(async () => {
        setMembers(groupId ? await groups.get_group_users(groupId) : []);
    }, [groupId]);

    useEffect(() => {
        if (ready && groupId && session) {
            loadData();
            loadLists();
            loadMembers();
        }
    }, [ready, session, groupId]);

    useServerEvent(`group.${groupId ?? "null"}.changed`, loadData);
    useServerEvent(`group.${groupId ?? "null"}.lists`, loadLists);
    useServerEvent(`group.${groupId ?? "null"}.users`, loadMembers);

    const { createList } = useModals();

    const [search, setSearch] = useState("");

    return group && groupId ? (
        <Stack gap="sm">
            <Stack gap="sm" className="search-header">
                <Group gap="sm">
                    <TextInput
                        value={search}
                        onChange={(ev) => setSearch(ev.target.value)}
                        placeholder={t("views.group.actions.search")}
                        leftSection={<MdSearch size="1.3em" />}
                        variant="filled"
                        size="lg"
                        style={{ flexGrow: 2 }}
                    />
                    <ActionIcon size="xl" variant="subtle">
                        <MdSettings size="1.8em" />
                    </ActionIcon>
                </Group>
                <Divider />
            </Stack>
            <SimpleGrid
                className="group-list-panel"
                cols={{
                    base: 1,
                    sm: 2,
                    md: 4,
                    xl: 6,
                }}
            >
                {lists
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .filter((v) => v.name.match(new RegExp(search, "i")))
                    .map((v) => (
                        <ListCard list={v} key={v.id} />
                    ))}
                <Card className="grocky-item create create-list" withBorder>
                    <Box
                        className="creation-button list"
                        onClick={() =>
                            createList({
                                ownerType: "group",
                                ownerId: groupId ?? "",
                            })
                        }
                    >
                        <MdList size="1.5em" />
                        <Text className="button-title">
                            {t("views.home.items.create.list")}
                        </Text>
                    </Box>
                </Card>
            </SimpleGrid>
        </Stack>
    ) : (
        <Loader className="group-loader" size="lg" />
    );
}
