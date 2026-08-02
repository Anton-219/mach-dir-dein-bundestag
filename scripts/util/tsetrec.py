def findAllCombinations(ls, t):
    ls = sorted(ls, key=lambda x: x[1], reverse=True)

    def _sum(summations):
        return sum(elem[1] for elem in summations)

    def _find(start, news):
        if _sum(start) >= t:
            return [start]
        if not news:
            return []
        new_list = []
        for j, list_elem in enumerate(news):
            recursive_found = _find([*start, list_elem], news[j + 1:])
            if recursive_found:
                new_list.extend(recursive_found)
        return new_list

    return _find([], ls)
